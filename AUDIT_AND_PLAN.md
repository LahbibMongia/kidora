# KidOra architecture audit and remediation record

This audit reviewed the app source, package manifests, and local run setup.
The high priority startup, authorization, data handling, and booking issues
found in that review have been addressed in this pass.

## Current architecture

- npm workspaces and Turborepo manage a two-app monorepo.
- `apps/frontend` is a React 18 single-page app built with Vite and Tailwind 3.
- `apps/backend` is a CommonJS Express API using Mongoose and MongoDB.
- Development runs the Vite server on port 3000 and the API on port 5000.
- Production builds the frontend into `apps/frontend/dist` and serves it from
  the API process.
- Docker Compose provides a persistent local MongoDB service. Make targets
  start infrastructure, development servers, builds, and the production-style
  local process.

## Remediations made

### Startup and database

- Replaced the incomplete recommendation import and fixed the broken review
  response and obsolete document deletion call.
- The API waits for MongoDB and the unique booking-slot index before listening.
  Failed database startup exits with an error.
- Added `GET /health`, which reports database readiness.
- Standardized the database setting to `MONGODB_URI`; the old
  `Url_MongoDB` name remains temporarily supported.
- Added graceful SIGINT/SIGTERM shutdown and production static serving.

### Authentication and API access

- Added bearer-token verification against the current database user and role
  checks for private routes.
- Added ownership checks for profiles, reservations, notifications, reviews,
  and recommendations.
- Registration accepts parent and babysitter roles only. Admin accounts are
  created through the environment-backed `create-admin` command.
- Removed the fallback JWT key and require `JWT_SECRET` to be at least 32
  characters before startup.
- Hid password hashes and login counters from serialization, restricted update
  fields, and added login attempt limits.
- Added a per-process IP login limiter. Request logs now include method, status,
  and response time without bodies, headers, query strings, or credentials.

### Data and booking behavior

- Aligned review/recommendation fields and timestamp configuration with their
  controllers.
- Standardized resource routes under `/api/users`, `/api/reservations`,
  `/api/notifications`, `/api/reviews`, and `/api/recommendations`.
- Added request allowlists, schema validation, response data envelopes, query
  limits, and 4xx handling for validation, malformed IDs, and conflicts.
- Booking creation derives the parent from the authenticated account and
  validates UTC dates, times, sitter role, and duration.
- Prevents overlapping concurrent bookings with a unique per-minute slot-lock
  collection. Locks are released when bookings are cancelled, completed, or
  deleted.
- Added safe image upload handling with a 5 MB limit, allowed image types,
  signature checks, UUID filenames, and no client-controlled file paths.
- Removed request-body/header file logging and stopped exposing emails in the
  persistence diagnostic script.

### Monorepo and delivery

- Replaced the invalid Create React App shim with Vite 8; migrated asset imports,
  aliases, environment configuration, and the HTML entry point.
- Upgraded React to 18, updated Tailwind to the current v3 CLI/config format,
  removed Gulp 3 and misplaced dependencies, and retained one root npm lockfile.
- Added Node version requirements, a GitHub Actions install/build workflow,
  and Make targets for local development and a production-style local run.
- Updated the README with MongoDB, environment, administrator bootstrap, and
  run instructions.

## Follow-up work

These items need application-level decisions or additional coverage:

1. Add integration tests for authentication, permissions, booking overlap,
   notifications, and schema migrations. The current CI installs dependencies
   and builds the workspaces, but does not exercise HTTP/database workflows.
2. Add lint and formatting rules, then include them as CI gates after existing
   source has been brought into compliance.
3. Move login rate limiting to shared infrastructure (such as Redis or an API
   gateway) before running multiple backend instances; the current limiter is
   in-memory per process.
4. Define account recovery and an administrator unlock process. Login lockout
   is enforced, but this app still has no password reset flow.
5. The legacy migration command now normalizes review fields, timestamps,
   reservation times, and slot locks with a dry-run-first workflow. Review
   reported collisions manually and take verified backups before applying it;
   test it against representative production data before a live migration.
6. Configure production MongoDB authentication, backups, TLS, and secret
   management. The Compose database intentionally has no authentication and is
   for local development only.
7. Review API consumers outside this repository: old mixed-case user/review
   routes and singular notification/recommendation route prefixes were replaced
   by the resource routes listed above.
8. The frontend still stores bearer tokens in `localStorage`; consider moving
   session handling to secure HTTP-only cookies together with CSRF protection,
   or add a strict content security policy and review the app for XSS risks.

## Local commands

- `make infra-up`: start MongoDB and wait for its health check.
- `make infra-down`: stop MongoDB and preserve its data volume.
- `make infra-logs`: follow MongoDB logs.
- `make dev`: start MongoDB and both development servers.
- `make build`: build the frontend and check backend JavaScript syntax.
- `make start`: build the frontend and serve the production app from Express.
- `make create-admin`: create an administrator using `ADMIN_*` environment
  values.
