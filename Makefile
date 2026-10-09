.DEFAULT_GOAL := help
COMPOSE := docker compose -f compose.yaml

.PHONY: help install infra infra-up infra-down infra-logs dev start build create-admin seed-dev migrate migrate-apply

help:
	@printf '%s\n' \
	  'install      Install npm workspace dependencies' \
	  'infra        Alias for infra-up' \
	  'infra-up     Start MongoDB in Docker Compose' \
	  'infra-down   Stop MongoDB (keep its data volume)' \
	  'infra-logs   Follow MongoDB logs' \
	  'dev          Start MongoDB, then frontend and API in dev mode' \
	  'start        Build and serve the production app with MongoDB' \
	  'build        Build/check all workspaces' \
	  'create-admin Create an administrator from ADMIN_* environment values' \
	  'seed-dev     Add or refresh demo parents, babysitters, and bookings' \
	  'migrate      Preview legacy MongoDB data changes (dry run)' \
	  'migrate-apply Apply the legacy MongoDB data migration'

install:
	npm ci

infra: infra-up

infra-up:
	$(COMPOSE) up -d --wait

infra-down:
	$(COMPOSE) down

infra-logs:
	$(COMPOSE) logs -f mongodb

dev: infra-up
	npm run dev

start: infra-up build
	NODE_ENV=production npm run start

build:
	npm run build

create-admin:
	npm run create-admin --workspace=@kidora/backend

seed-dev: infra-up
	npm run seed:dev --workspace=@kidora/backend

migrate:
	npm run migrate:legacy --workspace=@kidora/backend

migrate-apply:
	npm run migrate:legacy --workspace=@kidora/backend -- --apply
