# GIS CRM deployment

## Release flow

The production release pipeline is:

1. A commit is pushed to `main`.
2. `.github/workflows/ci.yml` validates the frontend, server, and both Docker images.
3. After CI succeeds, `.github/workflows/publish.yml` publishes:
   - `ghcr.io/devintax/inscrm-server:latest`
   - `ghcr.io/devintax/inscrm-client:latest`
   - commit-SHA tags for both images
4. After both images publish, the workflow calls the Coolify deployment webhook once.
5. Coolify pulls the new `latest` images and replaces the running containers.

The deployment job requires these GitHub Actions repository secrets:

- `COOLIFY_WEBHOOK`: the application's manual deployment webhook URL.
- `COOLIFY_TOKEN`: a Coolify API token limited to the `deploy` permission.

Application secrets and database credentials belong in Coolify's runtime environment configuration. They must not be committed to GitHub or supplied as Docker build arguments.

## Production topology

The CRM requires three cooperating services:

- `client`: `ghcr.io/devintax/inscrm-client:latest`, serving HTTP on port 80.
- `server`: `ghcr.io/devintax/inscrm-server:latest`, serving HTTP on port 5000.
- MongoDB 7 with persistent storage mounted at `/data/db`.

The client must be able to resolve the backend as `server` because its Nginx configuration proxies `/api/` to `http://server:5000`.

Persist the server uploads directory at `/app/uploads`. The public domain belongs only on the client service.

## Migration and cutover

Before changing DNS:

1. Create and deploy the Coolify resources with a temporary Coolify-generated URL.
2. Back up the laptop MongoDB with `mongodump`.
3. Restore the dump into the Coolify MongoDB volume.
4. Copy the uploads volume if it contains files.
5. Verify the dashboard, login, lead records, and lead details.
6. Confirm an unauthenticated request to `/api/v1/external/leads` is rejected with HTTP 401.
7. Submit a controlled lead and verify the InsForge-to-CRM flow.
8. Point `inscrm.dfgworld.net` to Coolify and verify TLS and application health.

Keep the laptop stack and tunnel available for rollback for at least 24–48 hours after cutover.

## Rollback

Every successful release publishes an immutable image tag beginning with `sha-`. To roll back:

1. Open the GIS CRM resource in Coolify.
2. Change both application image tags from `latest` to the matching prior `sha-<commit>` tag.
3. Deploy both resources.
4. Verify `/health`, login, dashboard data, and lead ingestion.

Database changes require their own rollback plan. Switching an application image does not undo MongoDB data changes.
