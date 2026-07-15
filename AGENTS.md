# AGENTS.md

Compact orientation for OpenCode sessions in this repo. TypeScript ESM MCP server exposing TAPD (Tencent Agile Product Development) tools/resources/prompts over stdio.

- **npm:** `@npm_xiyuan/mcp-tapd-radar` · **bin:** `mcp-tapd-radar` · **repo:** `github.com/jiyi1990118/mcp-tapd-radar`
- `CLAUDE.md` holds the fuller reference (status-value tables, per-endpoint API doc index). This file captures only what's easy to get wrong.

## Commands

```bash
npm run build      # tsc -> dist/ (also the typecheck gate; strict). No separate typecheck script.
npm run dev        # tsc --watch
npm start          # node dist/index.js (stdio). Needs TAPD_CLIENT_ID/SECRET.
npm test           # vitest run (unit tests, no network)
npm run test:watch # vitest watch
npm run lint       # eslint src/ only (flat config eslint.config.js)
npm run clean      # rm -rf dist
npm publish        # runs prepublishOnly -> build first
```

Single test: `npx vitest run tests/helpers.test.ts` · by name: `npx vitest run -t "convertDataToArray"`.

**Build before running or publishing** - the server executes from `dist/`, never source. Node >= 18.

## Environment

- `TAPD_CLIENT_ID` / `TAPD_CLIENT_SECRET` - **required**; `index.ts` exits 1 if missing.
- `TAPD_WORKSPACE_ID` - optional default workspace.
- `TAPD_API_BASE_URL` - defaults to `https://api.tapd.cn`.
- `LOG_LEVEL` - `debug|info|warn|error`, default `info` (read in `src/utils/logger.ts`).
- `TAPD_IMAGE_DOWNLOAD_ENABLED` - default `true`. When true, `tapd_get_story/bug/task` download description images to disk (parallel), replace URLs in the description with local file paths, and return **text only** (no base64). Each tool also takes `download_images` / `image_dir` params that override the env default per call.
- `TAPD_IMAGE_DOWNLOAD_DIR` - default `./.tapd-images`. Images land under `{dir}/{workspace_id}/{entity_type}_{entity_id}/{url-hash}.{ext}` and are cached by URL hash (re-runs skip re-download).
- `TAPD_IMAGE_DOWNLOAD_LIMIT` - default `50`. Hard cap on images per detail call; beyond it, remaining URLs stay remote.
- `TAPD_IMAGE_CONCURRENCY` - default `5`. Max parallel image downloads.

`import 'dotenv/config'` runs in `index.ts`, so `.env` works locally. Under MCP, pass vars via the server config `env` field (see README "Installation & Configuration").

## Architecture

```
src/index.ts        McpServer + StdioServerTransport; registers 9 tool modules + resources/workspace.ts + prompts/templates.ts
src/api/            TapdApiClient (fetch + auth + retry), QueryBuilder (TAPD query syntax)
src/auth/           TapdAuthManager (OAuth2 client_credentials, token cache + auto-refresh)
src/tools/          story/bug/task (CRUD), iteration, workitem (count), comment, user, workspace, image, ping
src/utils/          error, helpers, logger, pagination, response (MCP response builders), tapdImages (image/detail rendering), imageConfig + imageStorage (disk download + URL->path rewrite)
src/types/tapd.ts   all TAPD interfaces
```

Each tool module exports `register*Tools(server, client)` and is called from `index.ts`. Add a tool by following that pattern and registering it in `index.ts`.

## Key patterns (verify against source - the write-endpoint rule below was wrong in older docs)

**Write endpoints - NOT PUT, NOT `/changes`:** single create/update/delete all hit `POST /stories`, `POST /bugs`, `POST /tasks` (also `/comments`, `/iterations/lock`, `/iterations/unlock`). Body carries `workspace_id` + `id`; update sends only the fields to change. **Delete = same `POST /{entity}` with `status: 'deleted'`.** The `/changes` endpoints do not exist (return HTML error pages).

**Batch update:** `POST /stories/batch_update_story` · `POST /bugs/batch_update_bug` · `POST /tasks/batch_update_task`. Body is JSON `{ workspace_id, workitems: [{ id, ...fields }] }` - NOT form-encoded. `TapdApiClient.post()` JSON-encodes object bodies; `URLSearchParams` bodies become form-encoded.

**API response format:** `{ "status": 1, "data": { "id1": {...}, "id2": {...} } }`. List endpoints return objects keyed by ID - unwrap with `convertDataToArray(data)` from `utils/helpers.ts`, never raw `Object.values()` in tool code. `status !== 1` throws `TapdError`; 401/403 retries once after `authManager.invalidateToken()`; network errors retry up to 3x with capped exponential backoff.

**Image handling (two modes):** `buildTapdDetailContent` in `utils/tapdImages.ts` drives `tapd_get_story/bug/task`.
- Disk mode (default, `TAPD_IMAGE_DOWNLOAD_ENABLED=true`): extracts image URLs from the entity, downloads them **in parallel** to `{downloadDir}/{workspace}/{entity}/` via `utils/imageStorage.ts`, then rewrites every remote URL in the description **in place** to its local file path. Returns text only (no base64) so token cost stays low; downstream tools parse each local path and insert analysis back at that position. Re-runs are cached by URL hash.
- Base64 mode (`download_images: false` or env disabled): legacy behavior - inline up to `autoDownloadLimit` (default 3) images as base64 content blocks.
`buildDetailResponse` strips HTML from `description` via `compactText`; disk mode restores the rewritten (path-bearing) description afterward so placeholders survive.

**QueryBuilder (`src/api/QueryBuilder.ts`):** fluent `add`, `addLike` (`LIKE<v>`), `addLikeOr`, `addNotEq`, `addEnumOr` (`a|b`), `addUserOr`, `addTimeRange` (`>d`, `<d`, `d~d`), `addMultiId`, `addPagination`, then `.build()` -> query string. Pagination: default 30, hard cap 200, page min 1 (`utils/pagination.ts`).

**Logging:** use `logger.*` from `utils/logger.ts` - it writes to **stderr**. Never `console.log`/stdout - stdout is the MCP transport.

**ESM imports:** Node16 resolution - every local import needs the `.js` extension (e.g. `'./utils/helpers.js'`) even though sources are `.ts`.

**Status values are workflow-configurable per workspace** - don't hardcode. See `CLAUDE.md` "Story / Bug / Task Status Values" for common value->Chinese mappings (user says "需求排期" -> send `planned`).

## API docs are the source of truth

Before adding or changing a tool, check `Docs/tapd文档/API参考/` (e.g. `14-需求API.md`, `15-缺陷API.md`, `16-任务API.md`). Don't assume an endpoint exists - e.g. there is no `/labels` API (labels are a field on stories/bugs/tasks), and webhooks have no TAPD API (webhook tools were removed; `tapd://webhooks/help` Resource points users to the web UI). `tapd://` URIs are MCP Resources, not HTTP.

## Testing

`tests/` (vitest, no fixtures/services): QueryBuilder, error classification, pagination, helpers, response format, tapdImages, imageStorage. `src/test-all-tools.ts` is a manual live-API smoke runner, not part of `npm test`.
