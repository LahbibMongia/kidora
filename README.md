# KidOra

This directory contains the npm workspaces and Turborepo monorepo for the
KidOra application.

## Workspaces

- `apps/frontend` — React application (Vite)
- `apps/backend` — Express API and MongoDB models

## Install and run locally

Requirements: Node.js 22.12 or newer (Node.js 24 LTS recommended), npm,
Docker with the Compose plugin, and GNU Make. Run these commands from the
repository root:

```sh
make install
cp apps/backend/.env.example apps/backend/.env
```

Edit `apps/backend/.env` and replace `JWT_SECRET` with a random secret of at
least 32 characters. The example MongoDB URI connects to the local Compose
database. Start the database and both app servers:

```sh
make dev
```

The frontend is at <http://localhost:3000>; the API is at
<http://localhost:5000>. The frontend defaults to `http://localhost:5000/api`.
Copy `apps/frontend/.env.example` to `apps/frontend/.env` only when you need to
set a different `VITE_API_URL`.

To run the production-style local server, use `make start`. It starts MongoDB,
builds the frontend, and serves that build from the API process. To create an
administrator, set `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and
`ADMIN_PHONE` in `apps/backend/.env`, then run `make create-admin`. Public
registration supports parent and babysitter accounts only.

Use `make infra-up`, `make infra-down`, and `make infra-logs` to manage MongoDB
separately. `make help` lists available commands. MongoDB data persists in a
named Docker volume when stopped; `docker compose -f compose.yaml down -v`
removes the volume and its data.

The Vite frontend runs on `http://localhost:3000` and uses
`http://localhost:5000/api` by default. Set `VITE_API_URL` in
`apps/frontend/.env` to override the API base URL.

Run `make build` to build the frontend and validate the backend JavaScript.
The API listens on port `5000` by default and allows requests from
`http://localhost:3000`; use `FRONTEND_URL` to change the allowed origin.

## Existing MongoDB data

The API connects to the database named in `MONGODB_URI` (or the legacy
`Url_MongoDB` variable). The default database is now `kidora`. Changing the
URI does not rename or copy an existing MongoDB database: it makes the API
connect to `kidora`, which may be empty. To keep data from the previous
`mongia` database, back it up and copy it before starting the renamed Compose
service. For a local MongoDB reachable on port 27017, run:

```sh
mongodump --uri="mongodb://127.0.0.1:27017/mongia" --out=./backup
mongorestore --uri="mongodb://127.0.0.1:27017/kidora" ./backup/mongia
```

The renamed Compose setup uses a new `kidora-mongodb-data` volume. Back up the
old database before running `make infra-up` with this configuration; the old
volume is left on disk but is not mounted by the new service. After copying
the data, stop the API and run `make migrate` to preview schema adjustments.
Review the summary and resolve any reported conflicts or unparseable records,
back up the target database, then run `make migrate-apply`. The migration
commands use the backend `.env` database URI and do not copy data between
MongoDB servers.

Stop the API before migrating to avoid concurrent writes. From the repository
root, run `make migrate` to preview email normalization, legacy review fields,
missing timestamps, reservation time formats, and booking slot locks. Read the
summary and resolve any reported collisions or unparseable records. Back up the
database, then run `make migrate-apply` to apply the changes. The migration is
idempotent for records it successfully updates. It does not copy data between
MongoDB servers; use `mongodump` and `mongorestore` for that. Both commands use
the backend `.env` database URI.

For a fresh installation, run `make dev`; there is no existing data to migrate.

See [AUDIT_AND_PLAN.md](./AUDIT_AND_PLAN.md) for the code audit and prioritized
architecture repair plan.

