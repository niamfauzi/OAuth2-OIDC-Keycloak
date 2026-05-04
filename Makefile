SHELL := /bin/bash

-include .env

POSTGRES_USER ?= app_user
POSTGRES_DB ?= app_db

.PHONY: help copy-env infra-up infra-down migrate db-shell run-product run-transaction run-web install-product install-web

help:
	@echo "Available commands:"
	@echo "  make copy-env         - create .env from .env.example if missing"
	@echo "  make infra-up         - start postgres and keycloak"
	@echo "  make infra-down       - stop docker compose services"
	@echo "  make migrate          - apply SQL migration to postgres"
	@echo "  make db-shell         - open psql shell to local postgres"
	@echo "  make install-product  - install product-api dependencies"
	@echo "  make install-web      - install web dependencies"
	@echo "  make run-product      - run Product API"
	@echo "  make run-transaction  - run Transaction API"
	@echo "  make run-web          - run Nuxt web app"

copy-env:
	@test -f .env || cp .env.example .env

infra-up:
	docker compose up -d postgres keycloak

infra-down:
	docker compose down

migrate:
	docker compose exec -T postgres psql -U $(POSTGRES_USER) -d $(POSTGRES_DB) -f /dev/stdin < migrations/001_init_products_transactions.sql

db-shell:
	docker compose exec postgres psql -U $(POSTGRES_USER) -d $(POSTGRES_DB)

install-product:
	cd apps/product-api && bun install

install-web:
	cd apps/web && npm install

run-product:
	cd apps/product-api && bun run dev

run-transaction:
	cd apps/transaction-api && GOCACHE=/tmp/go-build-cache go run .

run-web:
	cd apps/web && npm run dev
