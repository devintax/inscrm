# InsForge lead relay

The CRM receiver is complete. Its intended public origin is `https://inscrm.dfgworld.net`. Deploy `gis-lead-relay.ts` only after that hostname resolves and passes the unauthenticated HTTP 401 endpoint check.

Required function secrets:

- `GIS_CRM_BASE_URL` — `https://inscrm.dfgworld.net`, without `/api/v1`.
- `LEAD_INGEST_SECRET` — same random secret configured in the CRM API.
- `INSFORGE_BASE_URL` — InsForge backend origin.
- `INSFORGE_SERVICE_KEY` — server-side key able to update GIS tracking columns. Never expose it in browser code.

Apply `001_add_gis_sync_tracking.sql` as the `postgres` owner of the remote `leads` table. Live verification on 2026-08-12 showed that the MCP/API runs as `project_admin`; it has SELECT/INSERT/UPDATE/TRIGGER privileges but is neither a member of `postgres` nor a superuser, so PostgreSQL correctly rejects `ALTER TABLE` with `must be owner of table leads`.

`gis-lead-relay.js` is deployed as the active InsForge function `gis-lead-relay`. Configure its four server-side environment variables before wiring an INSERT database webhook to invoke it with the inserted row. If this InsForge version does not expose database webhooks, call this function from the landing page's existing server-side submission handler immediately after its unchanged InsForge insert. Do not call it from browser JavaScript.

The same function can be invoked by a scheduled fallback for rows where `gis_sync_status != 'synced'`. ERPNext's `sync_status`, `erpnext_lead_id`, `sync_error`, and `synced_at` remain independent and untouched.
