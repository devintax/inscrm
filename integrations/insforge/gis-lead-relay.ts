/**
 * InsForge edge function source. Deploy only after GIS_CRM_BASE_URL points to
 * the public HTTPS CRM deployment. Secrets are environment variables.
 */
export default async function relayLead(req: Request): Promise<Response> {
  if (req.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405 });

  const crmBaseUrl = Deno.env.get('GIS_CRM_BASE_URL');
  const ingestSecret = Deno.env.get('LEAD_INGEST_SECRET');
  if (!crmBaseUrl || !ingestSecret) {
    return Response.json({ error: 'Integration is not configured' }, { status: 503 });
  }

  const envelope = await req.json();
  const lead = envelope.record || envelope.new || envelope.payload || envelope;
  const sourceId = lead?.id;
  if (!sourceId) return Response.json({ error: 'Lead id is required' }, { status: 400 });

  try {
    const response = await fetch(`${crmBaseUrl.replace(/\/$/, '')}/api/v1/external/leads`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${ingestSecret}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(lead),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(`CRM ${response.status}: ${result.error || 'request failed'}`);

    // The CRM receiver owns GIS tracking callbacks so successful delivery is
    // not coupled to a second SDK request from the function runtime.
    return Response.json(result, { status: response.status });
  } catch (error) {
    return Response.json({ error: 'GIS CRM delivery failed' }, { status: 502 });
  }
}
