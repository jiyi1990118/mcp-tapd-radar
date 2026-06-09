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
│   ├── story.ts          # tapd_list/get/create/update/count/delete_stories
│   ├── bug.ts            # tapd_list/get/create/update/count/delete_bugs
│   ├── task.ts           # tapd_list/get/create/update/count/delete_tasks
│   ├── iteration.ts      # tapd_list/get_iterations
│   ├── comment.ts        # tapd_list/create_comments
│   ├── user.ts           # tapd_list/get_users
│   ├── webhook.ts        # tapd_list/create/delete_webhooks
│   ├── workspace.ts      # tapd_list/get_workspaces
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

**Update/delete endpoints**: Use `POST /stories/changes`, `POST /bugs/changes`, `POST /tasks/changes` — **not PUT**. Body must include `workspace_id`. Delete by setting `status: 'deleted'` via changes endpoint.

**Authentication**: `TapdAuthManager` caches tokens (7200s TTL) and auto-refreshes 60s before expiry. `TapdApiClient` retries once on 401/403 with `invalidateToken()`. Do not access private methods.

**TAPD query operators**: `LIKE<val>`, `LIKE_OR<val1|val2>`, `EQ<val>`, `NOT_EQ<val>`, `USER_OR<u1|u2>`, time ranges with `>`, `<`, `~`. All handled by `QueryBuilder`.

**Logger**: Use `logger.info/warn/error/debug` from `utils/logger.ts`. Never use `console.log/error` — stdout is reserved for MCP transport.

**Imports**: ESM with Node16 module resolution — all local imports must use `.js` extension (e.g. `'./utils/helpers.js'`).

## TAPD API Documentation

Complete docs in `./Docs/tapd文档/`:
- **README.md** - Index with API endpoints and quick reference
- **04-授权凭证-项目态.md** - OAuth token acquisition
- **07-API使用必读.md** - Query syntax, pagination, special operators
- **06-使用Webhook.md** - Webhook event types and payload format
