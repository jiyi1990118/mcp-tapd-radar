# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TAPD MCP Server (`@npm_xiyuan/mcp-tapd-radar`) - A Model Context Protocol server enabling AI assistants to interact with TAPD's project management API. Built with TypeScript and the `@modelcontextprotocol/sdk`.

- **npm:** `@npm_xiyuan/mcp-tapd-radar`
- **GitHub:** `git@github.com:jiyi1990118/mcp-tapd-radar.git`

## Commands

```bash
npm run build      # Compile TypeScript to dist/
npm run dev        # Watch mode compilation
npm run start      # Run the server (requires env vars)
npm run clean      # Remove dist/
npm test           # Run tests (vitest)
npm run lint       # Lint (eslint)
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
src/
├── index.ts              # MCP server entry - registers all tools/resources/prompts
├── auth/TapdAuthManager  # OAuth2 client_credentials token management + auto-refresh
├── api/
│   ├── TapdApiClient     # HTTP client with auth, retry, error classification, logging
│   └── QueryBuilder      # Builds TAPD special query syntax (LIKE, EQ, time ranges)
├── tools/
│   ├── story.ts          # tapd_list/get/create/update/batch_update/count/delete_stories
│   ├── bug.ts            # tapd_list/get/create/update/batch_update/count/delete_bugs
│   ├── task.ts           # tapd_list/get/create/update/batch_update/count/delete_tasks
│   ├── iteration.ts      # tapd_list/get/lock/unlock_iterations (lock/unlock require special permissions)
│   ├── comment.ts        # tapd_list/create_comments
│   ├── user.ts           # tapd_list/get_users
│   ├── webhook.ts        # tapd_list/create/delete_webhooks (local-only store, TAPD API does not expose webhook endpoints)
│   ├── workspace.ts      # tapd_list/get_workspaces
│   ├── image.ts          # tapd_download_image
│   └── ping.ts           # tapd_ping
├── resources/workspace.ts  # MCP Resources: tapd://workspaces, tapd://workspace/{id}, etc.
├── prompts/templates.ts    # MCP Prompts: bug triage, sprint planning, standup, etc.
├── types/tapd.ts           # All TAPD interface definitions
└── utils/
    ├── error.ts            # TapdError + HTTP error classification
    ├── helpers.ts          # convertDataToArray + pickDefined shared utilities
    ├── logger.ts           # Structured logger (writes to stderr)
    └── pagination.ts       # TAPD pagination constants + fetchAllPages helper
```

## Key Patterns

**Tool registration**: Each module exports a `register*Tools(server, client)` function called from `index.ts`. Tools use `server.registerTool()` with zod input schemas.

**API response format**: TAPD returns `{ status: 1, data: { "id": { ...fields } } }`. List endpoints return objects keyed by ID — use `convertDataToArray(data)` from `utils/helpers.ts` to get arrays.

**Batch update endpoints**: `POST /stories/batch_update_story`, `POST /bugs/batch_update_bug`, `POST /tasks/batch_update_task`. These require JSON body with `workitems: [{id, ...fields}]` array format — NOT form-encoded. See API docs for exact payload structure.

**Update/delete endpoints**: Use `POST /stories`, `POST /bugs`, `POST /tasks` — **not PUT** and **not /changes**. The `/changes` endpoints do not exist (return HTML error pages). Body must include `workspace_id` and `id`. Delete by setting `status: 'deleted'` via the main endpoint.

**Comment entry_type mapping**: TAPD API uses plural forms: `story` → `stories`, `bug` → `bug`, `task` → `tasks`. The MCP tool accepts user-friendly names and maps them internally. See `src/tools/comment.ts`.

**Labels**: TAPD does not have a standalone `/labels` API endpoint. Labels are managed through the `label` field on stories/bugs/tasks and are auto-created on first use.

**Webhooks**: TAPD Open API does NOT expose `/webhooks` endpoints. The MCP webhook tools operate on a local in-memory store only. Real webhook configuration must be done via TAPD web UI.

**Iteration lock/unlock**: `POST /iterations/lock` and `POST /iterations/unlock` require special app permissions. If 403 is returned, the app lacks these permissions.

**Authentication**: `TapdAuthManager` caches tokens (7200s TTL) and auto-refreshes 60s before expiry. `TapdApiClient` retries once on 401/403 with `invalidateToken()`. Do not access private methods.

**TAPD query operators**: `LIKE<val>`, `LIKE_OR<val1|val2>`, `EQ<val>`, `NOT_EQ<val>`, `USER_OR<u1|u2>`, time ranges with `>`, `<`, `~`. All handled by `QueryBuilder`.

**Logger**: Use `logger.info/warn/error/debug` from `utils/logger.ts`. Never use `console.log/error` — stdout is reserved for MCP transport.

**Imports**: ESM with Node16 module resolution — all local imports must use `.js` extension (e.g. `'./utils/helpers.js'`).

## Development Rule: API Documentation First

**Always consult `./Docs/tapd文档/API参考/` before implementing new tools or modifying existing ones.**

The API reference docs in `Docs/tapd文档/API参考/` are the **source of truth** for:
- Correct endpoint URLs
- Required vs optional parameters
- Parameter types and formats
- Special payload structures (e.g. `workitems` array for batch updates)
- Query operators and syntax

**Workflow for adding new tools:**
1. Read the relevant API doc in `Docs/tapd文档/API参考/`
2. Verify the endpoint exists and understand its parameter format
3. Test the endpoint with curl to confirm behavior
4. Implement the MCP tool following existing patterns
5. Update all documentation (README.md, README.zh.md, this file)

**Never assume an endpoint exists** — always verify against the API docs. For example:
- `/labels` endpoint does NOT exist (labels are fields on stories/bugs/tasks)
- Batch updates require `workitems: [{id, ...}]` JSON array format
- Some endpoints require `project_id` in addition to `workspace_id`

## TAPD API Documentation

Complete docs in `./Docs/tapd文档/`:

### Development Guides
- **README.md** - Documentation index
- **04-授权凭证-项目态.md** - OAuth token acquisition
- **07-API使用必读.md** - Query syntax, pagination, special operators
- **06-使用Webhook.md** - Webhook event types and payload format

### API Reference (100+ endpoints)
- **[API参考/README.md](./Docs/tapd文档/API参考/README.md)** - Complete API reference index
- **[API参考/14-需求API.md](./Docs/tapd文档/API参考/14-需求API.md)** - Story API (40+ endpoints)
- **[API参考/15-缺陷API.md](./Docs/tapd文档/API参考/15-缺陷API.md)** - Bug API (20+ endpoints)
- **[API参考/16-任务API.md](./Docs/tapd文档/API参考/16-任务API.md)** - Task API (11 endpoints)
- **[API参考/17-迭代API.md](./Docs/tapd文档/API参考/17-迭代API.md)** - Iteration API (14 endpoints)
- **[API参考/18-评论API.md](./Docs/tapd文档/API参考/18-评论API.md)** - Comment API
- **[API参考/19-用户API.md](./Docs/tapd文档/API参考/19-用户API.md)** - User API
- **[API参考/20-工作空间API.md](./Docs/tapd文档/API参考/20-工作空间API.md)** - Workspace API
- **[API参考/21-Webhook API.md](./Docs/tapd文档/API参考/21-Webhook%20API.md)** - Webhook API
- **[API参考/22-附件API.md](./Docs/tapd文档/API参考/22-附件API.md)** - Attachment API
- **[API参考/23-标签API.md](./Docs/tapd文档/API参考/23-标签API.md)** - Label API

**Quick API Lookup**: When implementing or debugging TAPD tools, refer to the corresponding API doc. For example:
- `tapd_create_story` → [14-需求API.md#创建需求](./Docs/tapd文档/API参考/14-需求API.md#创建需求)
- `tapd_update_story` → [14-需求API.md#批量更新需求](./Docs/tapd文档/API参考/14-需求API.md#批量更新需求)
- `tapd_list_bugs` → [15-缺陷API.md#获取缺陷](./Docs/tapd文档/API参考/15-缺陷API.md#获取缺陷)
