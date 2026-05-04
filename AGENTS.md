# Repository Guidelines

## Project Structure & Module Organization

This repository is a small OAuth2/OIDC learning stack. Keep changes scoped to the service they affect:

- `apps/web/`: Nuxt 3 frontend pages and browser-side helpers.
- `apps/product-api/`: Bun + Elysia Product API, with source in `src/`.
- `apps/transaction-api/`: Go Transaction API, currently centered on `main.go`.
- `migrations/`: PostgreSQL schema migrations, applied manually through `make migrate`.
- `infra/`: Docker and Keycloak notes/configuration.
- `docs/`: architecture notes and staged prompt history.

Root-level files such as `Makefile`, `docker-compose.yml`, `.env.example`, and `README.md` define the local development workflow.

## Build, Test, and Development Commands

Use `make help` to see available commands. Common commands:

- `make copy-env`: create `.env` from `.env.example` if it is missing.
- `make infra-up`: start local PostgreSQL and Keycloak through Docker Compose.
- `make migrate`: apply `migrations/001_init_products_transactions.sql`.
- `make run-product`: run the Product API with Bun watch mode.
- `make run-transaction`: run the Go Transaction API.
- `make run-web`: run the Nuxt web app.
- `make infra-down`: stop Docker Compose services.

For package-level commands, use `cd apps/web && npm run build` for the Nuxt production build and `cd apps/product-api && bun run start` for the Product API without watch mode.

## Coding Style & Naming Conventions

Follow the style already present in each service. TypeScript uses 2-space indentation, double quotes, semicolons omitted, and kebab-case filenames such as `decode-jwt.ts`. Vue pages should stay under `apps/web/pages/` and use route-oriented names such as `products.vue` or `auth/callback.vue`. Go code must be formatted with `gofmt`; keep exported names only when needed outside the package.

## Testing Guidelines

Automated tests are not configured yet. Before submitting changes, run the affected services locally and verify the relevant endpoints or pages. For Go changes, run `cd apps/transaction-api && go test ./...` once tests are added. For frontend/API behavior, document manual checks such as login flow, `/products`, `/transactions`, and `/health`.

## Commit & Pull Request Guidelines

This checkout does not include Git history, so use clear, conventional-style commit messages such as `feat: add product creation flow` or `fix: handle missing bearer token`. Pull requests should include a concise description, affected services, setup or migration notes, manual test results, and screenshots for visible UI changes.

## Security & Configuration Tips

Do not commit `.env` or real credentials. Update `.env.example` when adding required configuration. Keep OAuth/OIDC settings aligned across Nuxt, APIs, Keycloak, and Docker Compose so local flows remain reproducible.
