/**
 * InsForge edge function source. Deploy only after GIS_CRM_BASE_URL points to
 * the public HTTPS CRM deployment. Secrets are environment variables.
 */
import { createClient } from 'npm:@insforge/sdk';

export default async function relayLead(req: Request): Promise<Response> {
  if (req.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405 });

  const crmBaseUrl = Deno.env.get('GIS_CRM_BASE_URL');
  const ingestSecret = Deno.env.get('LEAD_INGEST_SECRET');
  const insforgeBaseUrl = Deno.env.get('INSFORGE_BASE_URL');
  const serviceKey = Deno.env.get('INSFORGE_SERVICE_KEY');
  if (!crmBaseUrl || !ingestSecret || !insforgeBaseUrl || !serviceKey) {
    return Response.json({ error: 'Integration is not configured' }, { status: 503 });
  }

  const envelope = await req.json();
  const lead = envelope.record || envelope.new || envelope;
  const sourceId = lead?.id;
  if (!sourceId) return Response.json({ error: 'Lead id is required' }, { status: 400 });

  const insforge = createClient({ baseUrl: insforgeBaseUrl, anonKey: serviceKey });
  try {
    const response = await fetch(`${crmBaseUrl.replace(/\/$/, '')}/api/v1/external/leads`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${ingestSecret}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(lead),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(`CRM ${response.status}: ${result.error || 'request failed'}`);

    await insforge.database.from('leads').update({
      gis_sync_status: 'synced', gis_crm_lead_id: result.leadId,
      gis_sync_error: null, gis_synced_at: new Date().toISOString(),
    }).eq('id', sourceId);
    return Response.json(result, { status: response.status });
  } catch (error) {
    await insforge.database.from('leads').update({
      gis_sync_status: 'failed', gis_sync_error: String(error).slice(0, 2000),
    }).eq('id', sourceId);
    return Response.json({ error: 'GIS CRM delivery failed' }, { status: 502 });
  }
}
