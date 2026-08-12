module.exports = async function relayLead(request) {
  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  const crmBaseUrl = Deno.env.get('GIS_CRM_BASE_URL');
  const ingestSecret = Deno.env.get('LEAD_INGEST_SECRET');
  const insforgeBaseUrl = Deno.env.get('INSFORGE_BASE_URL');
  // createClient expects the PostgREST anon JWT, not an InsForge admin API key.
  const serviceKey = Deno.env.get('ANON_KEY');
  if (!crmBaseUrl || !ingestSecret || !insforgeBaseUrl || !serviceKey) {
    return Response.json({ error: 'Integration is not configured' }, { status: 503 });
  }

  const envelope = await request.json();
  const lead = envelope.record || envelope.new || envelope.payload || envelope;
  const sourceId = lead && lead.id;
  if (!sourceId) {
    return Response.json({ error: 'Lead id is required' }, { status: 400 });
  }

  const insforge = createClient({ baseUrl: insforgeBaseUrl, anonKey: serviceKey });

  try {
    const crmResponse = await fetch(
      `${crmBaseUrl.replace(/\/$/, '')}/api/v1/external/leads`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${ingestSecret}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(lead),
      },
    );

    const result = await crmResponse.json();
    if (!crmResponse.ok) {
      throw new Error(`CRM ${crmResponse.status}: ${result.error || 'request failed'}`);
    }

    const { error: updateError } = await insforge.database
      .from('leads')
      .update({
        gis_sync_status: 'synced',
        gis_crm_lead_id: result.leadId,
        gis_sync_error: null,
        gis_synced_at: new Date().toISOString(),
      })
      .eq('id', sourceId);

    if (updateError) {
      throw new Error(`InsForge tracking update failed: ${updateError.message || updateError}`);
    }

    return Response.json(result, { status: crmResponse.status });
  } catch (error) {
    await insforge.database
      .from('leads')
      .update({
        gis_sync_status: 'failed',
        gis_sync_error: String(error).slice(0, 2000),
      })
      .eq('id', sourceId);

    return Response.json({ error: 'GIS CRM delivery failed' }, { status: 502 });
  }
};
