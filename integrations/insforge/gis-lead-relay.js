module.exports = async function relayLead(request) {
  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  const crmBaseUrl = Deno.env.get('GIS_CRM_BASE_URL');
  const ingestSecret = Deno.env.get('LEAD_INGEST_SECRET');
  if (!crmBaseUrl || !ingestSecret) {
    return Response.json({ error: 'Integration is not configured' }, { status: 503 });
  }

  const envelope = await request.json();
  const lead = envelope.record || envelope.new || envelope.payload || envelope;
  const sourceId = lead && lead.id;
  if (!sourceId) {
    return Response.json({ error: 'Lead id is required' }, { status: 400 });
  }

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

    // The CRM receiver owns GIS tracking callbacks. Keeping that update in one
    // place prevents a successful delivery from being reported as failed when
    // the function runtime cannot reach InsForge through a secondary SDK call.
    return Response.json(result, { status: crmResponse.status });
  } catch (error) {
    return Response.json({ error: 'GIS CRM delivery failed' }, { status: 502 });
  }
};
