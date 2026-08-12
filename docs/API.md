# API reference

Base path: `/api/v1`. Except for registration and login, routes require `Authorization: Bearer <token>`.

## Authentication and users

- `POST /user/register` — create a standard user.
- `POST /user/login` — authenticate and return a JWT.
- `GET /user/list`, `GET /user/view/:id` — list or view users.
- `PUT /user/edit/:id`, `DELETE /user/delete/:id` — update or soft-delete a user.

## CRM resources

The standard resource pattern is `GET /<resource>/list`, `GET /<resource>/view/:id`, `POST /<resource>/add`, `PUT /<resource>/edit/:id`, `DELETE /<resource>/delete/:id`, and, where implemented, `POST /<resource>/deletemany`.

Resources: `lead`, `contact`, `claim`, `note`, `call`, `meeting`, `email`, `task`, `policy`, and `emailtemplate`.

Some inherited resources do not implement every standard operation. Email templates retain the upstream bulk-delete spelling `/emailtemplate/deletemanny` for frontend compatibility.

## Documents

- `GET /document/list`
- `POST /document/upload` — multipart upload using field `file`.
- `GET /document/file/:fileId`
- `DELETE /document/delete/:id`
- `POST /document/deletemany`
- `GET /policydocument/list`
- `POST /policydocument/upload` — multipart upload using field `file`.
- `GET /policydocument/file/:fileId`
- `DELETE /policydocument/delete/:id`

## Infrastructure

- `GET /health` — unversioned container health probe; no authentication required.

## External lead ingest

- `POST /api/v1/external/leads`
- Authentication: `Authorization: Bearer <LEAD_INGEST_SECRET>`.
- Required: valid `email`, `source`, `created_at` or `date_of_inquiry`, and at least one valid US phone in `phone`, `phone_home`, or `phone_cell_work`.
- Success: HTTP 201 with `{ "status": "created", "leadId": "..." }`.
- Duplicate within the configured window: HTTP 200 with `{ "status": "duplicate", "leadId": "..." }`.
- Phone numbers are normalized to E.164. Unknown optional fields are retained in `externalData`.

Example:

```sh
curl -X POST "$CRM_BASE_URL/api/v1/external/leads" \
  -H "Authorization: Bearer $LEAD_INGEST_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"id":123,"full_name":"Sample Lead","email":"sample@example.com","phone":"(302) 555-0100","source":"web_quote_form","created_at":"2026-08-12T12:00:00Z"}'
```
