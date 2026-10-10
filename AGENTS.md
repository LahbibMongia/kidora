# Project guide for agents

Read this guide first. Use the project map and targeted file references below
before searching broadly; they summarize the architecture and common workflows
so routine tasks do not need a repository-wide rescan. Open source files when a
task depends on implementation details that may have changed.

## Repository

- KidOra is an npm workspace monorepo. Node.js `>=22.12.0`, npm, Docker Compose,
  and MongoDB are used locally.
- `apps/frontend`: React 18, React Router 5, Vite, Tailwind.
- `apps/backend`: Express API, Mongoose models, JWT authentication.
- `compose.yaml`: local MongoDB 7, published on `127.0.0.1:27017` with a
  persistent volume.
- `Makefile`: common setup, build, database, seed, admin, and migration tasks.
- `README.md`: installation, configuration, end-to-end testing, seed accounts,
  and legacy database migration guidance.
- Shell commands in this environment must be prefixed with `rtk` as documented
  in the supplied RTK instructions (for example, `rtk npm run build`).

## Start here by task

| Task | Main files |
| --- | --- |
| Frontend routes and auth guards | `apps/frontend/src/index.jsx`, `apps/frontend/src/components/ProtectedRoute.jsx`, `apps/frontend/src/context/AuthContext.jsx` |
| Sign-up and sign-in | `apps/frontend/src/views/auth/Register.jsx`, `apps/frontend/src/views/auth/Login.jsx`, `apps/frontend/src/service/authService.js` |
| Parent profile and reservations | `apps/frontend/src/views/Profile.jsx`, `apps/frontend/src/service/restApiReservation.js` |
| Babysitter profile | `apps/frontend/src/views/auth/Profile-bs.jsx` |
| Browse and book a babysitter | `apps/frontend/src/views/auth/booking.jsx`, `apps/frontend/src/service/api.js` |
| API routes and auth | `apps/backend/routes/`, `middlewares/auth.js`, `controllers/` |
| Data shape and validation | `apps/backend/models/` |
| E2E browser flow | `playwright.config.js`, `tests/e2e/application-flow.spec.js` |
| Dev data seed | `apps/backend/scripts/seedDevData.js` |

## Application flow and data notes

- Public registration supports `parent` and `babysitter` roles. Registration
  creates the account but the frontend does not retain the returned session;
  sign in separately.
- Login redirects parents to `/profile` and babysitters to `/profile-bs`.
  Parents browse and book at `/auth/booking`.
- The main API routes are `/api/users` and `/api/reservations`. The frontend
  uses relative `/api` requests; Vite proxies these to port 5000 by default.
- Parent reservation records return the populated sitter as
  `reservation.babysitter`. Use that field when displaying sitter details.
- User phone data is stored as `phone` (not `tel`).
- Active bookings (`pending`, `confirmed`) reserve minute slots in
  `ReservationSlot`; when creating sample bookings, keep their times clear of
  other active bookings for that sitter.
- API health is `GET /health`; it returns 200 only after MongoDB connects.

## Common commands

- `rtk make install`: install workspace dependencies.
- `rtk make dev`: start MongoDB and the frontend/API development servers.
- `rtk make build`: build the frontend and syntax-check backend JavaScript.
- `rtk make seed-dev`: add or refresh local demo accounts and bookings.
- `rtk make create-admin`: create an admin using `ADMIN_*` values in
  `apps/backend/.env`.
- `rtk make migrate`: preview legacy data changes; inspect its output before
  using `rtk make migrate-apply`.
- `rtk npm run test:e2e`: run Playwright against local MongoDB.

## Development seed data

`make seed-dev` starts local MongoDB and creates/refreshes three parents, four
babysitters, and four bookings in the configured local database. It is additive:
it does not delete unrelated records. It refuses `NODE_ENV=production` and
non-local MongoDB hosts. Re-running it resets the seeded accounts' passwords
and refreshes their booking dates. Shared password: `KidoraDemo123`.

| Role | Email |
| --- | --- |
| Parent | `demo.parent.alex@example.test` |
| Parent | `demo.parent.jamie@example.test` |
| Parent | `demo.parent.taylor@example.test` |
| Babysitter | `demo.babysitter.lina@example.test` |
| Babysitter | `demo.babysitter.amir@example.test` |
| Babysitter | `demo.babysitter.sofia@example.test` |
| Babysitter | `demo.babysitter.noah@example.test` |

## End-to-end tests

- Playwright is a root dev dependency. The suite needs a local MongoDB on port
  27017 and Chromium installed (`rtk npx playwright install chromium`).
- `playwright.config.js` starts its own backend on 5001 and frontend on 3001,
  with the Vite proxy targeting that backend. This avoids colliding with the
  normal development ports.
- The E2E API uses `kidora_e2e`, separate from the default `kidora` database.
- The current browser journey registers a sitter and parent, signs in to both
  profiles, creates a booking, and verifies the booking details on the parent
  profile. It runs serially and uses a unique future slot per run.
- If E2E startup fails, check MongoDB health and whether ports 3001/5001 are
  available before changing app behavior.

## Environment and safety

- Backend environment example: `apps/backend/.env.example`. A valid
  `JWT_SECRET` of at least 32 characters and a MongoDB URI are required.
- Default local MongoDB database is `kidora`; the E2E database is
  `kidora_e2e`. Do not point E2E at a personal or production database.
- Migrations can alter existing data. Run the preview first, review conflicts,
  and back up the target database before applying changes.
