# InsForge lead relay

The CRM receiver is complete. Its intended public origin is `https://inscrm.dfgworld.net`. Deploy `gis-lead-relay.ts` only after that hostname resolves and passes the unauthenticated HTTP 401 endpoint check.

Required function secrets:

- `GIS_CRM_BASE_URL` — `https://inscrm.dfgworld.net`, without `/api/v1`.
- `LEAD_INGEST_SECRET` — same random secret configured in the CRM API.

The CRM receiver performs the authoritative GIS tracking callback with its
server-side `INSFORGE_BASE_URL` and `INSFORGE_API_KEY`. The relay must not make
a second tracking update: doing so can incorrectly report a successful CRM
delivery as failed when the function runtime cannot reach InsForge directly.

Apply `001_add_gis_sync_tracking.sql` as the `postgres` owner of the remote `leads` table. Live verification on 2026-08-12 showed that the MCP/API runs as `project_admin`; it has SELECT/INSERT/UPDATE/TRIGGER privileges but is neither a member of `postgres` nor a superuser, so PostgreSQL correctly rejects `ALTER TABLE` with `must be owner of table leads`.

`gis-lead-relay.js` is deployed as the active InsForge function `gis-lead-relay`.
Configure its two server-side environment variables, then configure the
`gis-leads` realtime channel webhook as
`https://insforge.dfgworld.net/functions/gis-lead-relay`. The existing
`trg_leads_gis_crm_insert` trigger publishes inserted rows to that channel.
Do not call the CRM receiver from browser JavaScript.

The same function can be invoked by a scheduled fallback for rows where `gis_sync_status != 'synced'`. ERPNext's `sync_status`, `erpnext_lead_id`, `sync_error`, and `synced_at` remain independent and untouched.
