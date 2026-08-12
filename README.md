# Good Insurance Services CRM

Good Insurance Services CRM—shown as GIS Insurance in compact interface areas—is our independently branded, self-hosted customer relationship management system. It manages leads, contacts, policies, claims, calls, meetings, tasks, documents, email templates, and users through a React frontend and an Express/MongoDB API.

The interface uses the supplied GIS globe-and-red-ring logo. Its sampled palette is red `#FF0000`, deep blue `#216499`, and gold `#DCBB77`.

## Run locally with Docker

Requirements: Docker Desktop with Docker Compose v2.

1. Copy `.env.example` to `.env`.
2. Replace every value beginning with `replace-with-`, especially `MONGO_ROOT_PASSWORD`, `JWT_SECRET`, and `ADMIN_PASSWORD`.
3. Start the stack:

   ```sh
   docker compose up --build -d
   ```

4. Seed or rotate the initial administrator:

   ```sh
   docker compose run --rm server npm run seed:admin
   ```

5. Open `http://localhost:3000` and sign in with `ADMIN_EMAIL` and `ADMIN_PASSWORD`.

## Public Cloudflare tunnel

Set `CLOUDFLARE_TUNNEL_TOKEN` only in the git-ignored `.env`. The `cloudflared` Compose sidecar makes outbound connections and publishes no host port. In Cloudflare Zero Trust, configure this tunnel's Public Hostname as:

- Hostname: `inscrm.dfgworld.net`
- Service type: HTTP
- Service URL: `http://client:80`

The service URL must use the Compose service name and internal port, not `localhost:3000`. After saving the hostname, verify the homepage and confirm an unauthenticated `POST https://inscrm.dfgworld.net/api/v1/external/leads` returns HTTP 401.

The CRM uses bearer JWTs stored by the inherited frontend, not cookie sessions, so `Secure`/`HttpOnly`/`SameSite` cookie flags are not applicable. Login has a separate failed-attempt rate limiter, registration enforces 12-character mixed-complexity passwords, and no default administrator is automatically created. Cloudflare Access is recommended before production use of the dashboard.

MongoDB and the API are only exposed to the private Compose network. Nginx exposes GIS Insurance on port 3000 and proxies `/api/v1` to the API. Uploaded files and database data use named Docker volumes.

Useful commands:

```sh
docker compose ps
docker compose logs -f server
docker compose down
```

`docker compose down` preserves data. Adding `--volumes` permanently removes the database and uploads, so use it carefully.

## Configuration and documentation

- [Audit report](docs/AUDIT.md)
- [API reference](docs/API.md)
- [Environment template](.env.example)

SMTP is optional until email sending is used. Set the `SMTP_*` variables before enabling that workflow in production. Configure `CORS_ORIGINS` as a comma-separated allowlist of exact frontend origins.

## Branding checklist

- Review the supplied GIS logo at small sizes and provide a simplified mark if desired.
- Set the real repository URL in both `package.json` files.
- Configure the production domain, HTTPS reverse proxy, SMTP service, backups, and secret management.

## License

The upstream README describes the source project as MIT-licensed, but the cloned repository contains no root license file. The included frontend does contain `frontend/LICENSE.md`, the MIT license and copyright notice for Minimal UI. That file is preserved and must remain with copies or substantial portions of that code. Before commercial distribution, verify the upstream repository's intended licensing and retain all applicable notices.
