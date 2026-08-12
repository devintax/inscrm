# Upstream audit

## Architecture

The repository is a two-package project, not a package-manager workspace:

- `frontend/`: Create React App, React 18, React Router 6, Redux/Redux Toolkit, Axios, Formik/Yup, Material UI 5, Emotion, ApexCharts, FullCalendar, and Data Grid.
- `server/`: Node.js/Express 4 using the `esm` compatibility loader, Mongoose/MongoDB, bcrypt, JWT, Multer, Nodemailer, and route/controller/model layers.

The API covers leads, contacts, claims, notes, calls, meetings, emails, tasks, users, policies, documents, policy documents, and email templates. MongoDB schemas live in `server/model`. Authentication is a bearer JWT stored by the frontend in local storage.

The server now uses Node's native ES module loader. The inherited imports omit file extensions, so the current start scripts use Node 18's `--experimental-specifier-resolution=node` compatibility flag; converting imports to explicit extensions is recommended during a future server modernization.

## Findings and remediation

- Database URL and name previously came from undocumented `DB_URL`/`DB_NAME` values. They now use `MONGODB_URI` and `MONGODB_DATABASE`, and Compose provisions a private MongoDB service with authentication and persistent storage.
- The JWT signing and verification secret was hardcoded as `secret_key`. It is now required through `JWT_SECRET`; invalid tokens return HTTP 401.
- A known `admin@gmail.com` / `admin123` account was silently created at startup. Automatic seeding was removed and replaced with an explicit environment-driven seed command.
- CORS previously allowed every origin. It now uses the `CORS_ORIGINS` allowlist.
- Helmet security headers and rate limiting were added.
- User management, email, email templates, and document downloads had missing authentication middleware. These routes now require authentication; login and registration remain public.
- SMTP host and sender details were hardcoded or incomplete. All SMTP configuration now comes from environment variables.
- The frontend used the original hosted Render API. It now defaults to same-origin `/api/v1/`, proxied internally by Nginx.
- All API resources are mounted under `/api/v1`; `/health` remains unversioned for infrastructure probes.

## Branding inventory

Upstream branding appeared in the root README, hosted demo URL, support email addresses, original navigation logo, two example uploaded logo images, and package metadata inherited from the Minimal UI starter. User-facing branding now uses Good Insurance Services and the compact name GIS Insurance. The supplied GIS logo is active on the login screen and navigation. Inactive upstream binary assets remain for provenance and safe review but are no longer referenced by the UI. Remove them only after confirming they are not desired.

The page metadata and web manifest also contained Minimal UI starter branding. These have been replaced. Colors sampled directly from the supplied logo are primary red `#FF0000`, deep blue `#216499`, and gold `#DCBB77`; lighter and darker theme steps are derived from those values.

## Integrations

- MongoDB: retained, now self-hosted in Docker.
- SMTP/Nodemailer: retained but disabled until credentials are configured.
- AWS SDK: no active AWS usage was found in application source, so the unused dependency was removed; no CRM feature was deleted.
- Google Fonts and cdnjs Simplebar stylesheet: still loaded by the browser from public CDNs. Self-host these assets for a fully offline deployment.
- Social links generated from contact data (Instagram and X/Twitter): retained as normal user-facing links.

## License

The upstream README claims MIT. No root `LICENSE` file was present in the cloned revision. `frontend/LICENSE.md` is an MIT notice copyrighted by Minimal UI and has been preserved. The discrepancy should be resolved with the upstream owner or repository history before commercial distribution.

## Validation notes

- Frontend production build: successful, with inherited ESLint warnings and a 1.62 MB gzip main bundle.
- Docker image builds: successful for client and server.
- Compose services: MongoDB and API healthchecks passed; the Nginx client served on port 3000.
- Authentication: explicit admin seed and login succeeded.
- Authenticated lead list: succeeded through the Nginx `/api/v1` proxy.
- Full browser-driven create-lead and create-policy workflows were not automated because the upstream repository includes no end-to-end test suite. These remain manual acceptance-test items alongside claims, documents, email, and calendar behavior.
- Dependency audit after install reported 31 frontend vulnerabilities (9 low, 10 moderate, 12 high) and 35 server development-tree vulnerabilities (5 low, 8 moderate, 18 high, 4 critical). The production server image reported 29 (3 low, 7 moderate, 17 high, 2 critical). Major dependency modernization is required before production exposure.

## Lead capture integration

`POST /api/v1/external/leads` provides a server-to-server receiver protected by a timing-safe bearer-secret check and a dedicated per-minute rate limit. It validates the actual InsForge schema, normalizes US phone numbers to E.164, maps short and full intake paths into the existing Lead model, retains extra source fields, merges 48-hour email/phone duplicates, captures consent metadata, and records outcomes in the `leadsynclogs` MongoDB collection.

The remote InsForge schema was inspected and matches the documented intake crosswalk. The connected InsForge API role is not the owner of `leads`, so its additive GIS tracking migration could not be applied through MCP. The local `insforge-backend` container was verified to be a separate project without that table. The idempotent owner-level migration and relay source are preserved under `integrations/insforge`. No ERPNext columns, data, triggers, or pipeline code were modified.

The Cloudflare tunnel sidecar connects successfully using outbound QUIC. Public activation additionally requires the tunnel's Cloudflare Zero Trust Public Hostname mapping: `inscrm.dfgworld.net` to `http://client:80`. A tunnel token starts the connector but does not itself create this DNS/ingress mapping.
