# AGENTS.md

## Project

TAPD MCP Server — TypeScript ESM project (`"type": "module"`). Provides MCP tools/resources/prompts for TAPD API.

- **npm:** `@npm_xiyuan/mcp-tapd-radar`
- **GitHub:** `git@github.com:jiyi1990118/mcp-tapd-radar.git`

- **npm:** `@npm_xiyuan/mcp-tapd-radar`
- **GitHub:** `git@github.com:jiyi1990118/mcp-tapd-radar.git`

- **npm:** `@npm_xiyuan/mcp-tapd-radar`
- **GitHub:** `git@github.com:jiyi1990118/mcp-tapd-radar.git`

- **npm:** `@npm_xiyuan/mcp-tapd-radar`
- **GitHub:** `git@github.com:jiyi1990118/mcp-tapd-radar.git`

## Commands

```bash
npm run build      # tsc → dist/ (required before start)
npm run dev        # tsc --watch
npm start          # node dist/index.js (stdio transport)
npm test           # vitest run
npm run lint       # eslint src/ only
npm run clean      # rm -rf dist
npm publish        # publish to npm (runs prepublishOnly → build)
```

**Always build before running.** The server runs from `dist/`, not source. `prepublishOnly` hook ensures build before publish.

## Environment

- `TAPD_CLIENT_ID` / `TAPD_CLIENT_SECRET` — **required**, OAuth credentials
- `TAPD_WORKSPACE_ID` — optional default workspace
- `TAPD_API_BASE_URL` — defaults to `https://api.tapd.cn`
- `LOG_LEVEL` — `debug`|`info`|`warn`|`error`, default `info`

`import 'dotenv/config'` is in `index.ts` — `.env` works for local dev. In MCP config, pass via `env` field.

## Architecture

```
src/index.ts → registers all tools/resources/prompts onto McpServer → StdioServerTransport
```

Each tool module exports `register*Tools(server: McpServer, client: TapdApiClient)`. Add new tools by following this pattern and registering in `index.ts`.

## Key Patterns

### TAPD API response format

```json
{ "status": 1, "data": { "id1": {...}, "id2": {...} } }
```

List endpoints return objects keyed by ID. Use `convertDataToArray(data)` from `utils/helpers.ts` to get arrays. Never use `Object.values()` directly — use the shared helper.

### Update/delete endpoints

Use `POST /stories/changes`, `POST /bugs/changes`, `POST /tasks/changes` — **not PUT**. Body must include `workspace_id` and `id`. Delete is done by setting `status: 'deleted'` via the changes endpoint.

### Shared utilities (`src/utils/helpers.ts`)

- `convertDataToArray(data)` — converts TAPD keyed-object to array
- `pickDefined(source, keys)` — picks only non-undefined fields for create/update bodies

### Logger (`src/utils/logger.ts`)

Always use `logger.info/warn/error/debug` instead of `console.log/error`. Logger writes to stderr (stdout is reserved for MCP transport).

### Auth & token refresh

`TapdAuthManager.invalidateToken()` is the public method to force a token refresh. `TapdApiClient` calls it on 401/403 before retrying. Do not access private methods.

### QueryBuilder (`src/api/QueryBuilder.ts`)

Fluent builder for TAPD query params. Supports `LIKE`, `LIKE_OR`, `EQ`, `NOT_EQ`, `USER_OR`, time ranges, enum OR, multi-ID, pagination. Use `.build()` to get the query string, then parse with `new URLSearchParams()`.

### Imports

ESM with Node16 module resolution — all local imports must use `.js` extension (e.g. `'./utils/helpers.js'`).

## Testing

Tests in `tests/`, vitest, no special setup needed. Covers QueryBuilder, error classification, pagination, helpers.

## Lint

ESLint flat config (`eslint.config.js`). Only lints `src/`. Rules: no-unused-vars (allow `_` prefix), no-explicit-any as warning.

## TAPD API Docs

`Docs/tapd文档/README.md` — index of all TAPD API endpoints and query syntax.
