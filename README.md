# mcp-tapd-radar

[![npm version](https://img.shields.io/npm/v/@npm_xiyuan/mcp-tapd-radar.svg)](https://www.npmjs.com/package/@npm_xiyuan/mcp-tapd-radar)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![MCP SDK](https://img.shields.io/badge/MCP_SDK-1.29-purple)](https://github.com/modelcontextprotocol/typescript-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server for TAPD (Tencent Agile Product Development). Enables AI assistants to interact with TAPD stories, bugs, tasks, iterations, and more using natural language.

English | **[中文](./README.zh.md)**

---

## Installation & Configuration

### Option 1: npx (Recommended)

Add to your MCP client configuration (e.g. `claude_desktop_config.json`, `mcp.json`):

```json
{
  "mcpServers": {
    "tapd": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@npm_xiyuan/mcp-tapd-radar"],
      "env": {
        "TAPD_CLIENT_ID": "your_client_id",
        "TAPD_CLIENT_SECRET": "your_client_secret",
        "TAPD_WORKSPACE_ID": "",
        "TAPD_API_BASE_URL": "https://api.tapd.cn",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

> `npx` automatically downloads and runs the latest version — no manual install needed.

### Option 2: Global Install

```bash
npm install -g @npm_xiyuan/mcp-tapd-radar
```

Then in your MCP config:

```json
{
  "mcpServers": {
    "tapd": {
      "type": "stdio",
      "command": "mcp-tapd-radar",
      "env": {
        "TAPD_CLIENT_ID": "your_client_id",
        "TAPD_CLIENT_SECRET": "your_client_secret"
      }
    }
  }
}
```

### Option 3: From Source

```bash
git clone git@github.com:jiyi1990118/mcp-tapd-radar.git
cd mcp-tapd-radar
npm install
npm run build
```

Then in your MCP config:

```json
{
  "mcpServers": {
    "tapd": {
      "type": "stdio",
      "command": "node",
      "args": ["/path/to/mcp-tapd-radar/dist/index.js"],
      "env": {
        "TAPD_CLIENT_ID": "your_client_id",
        "TAPD_CLIENT_SECRET": "your_client_secret"
      }
    }
  }
}
```

### Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `TAPD_CLIENT_ID` | **Yes** | — | TAPD Open Platform OAuth client ID |
| `TAPD_CLIENT_SECRET` | **Yes** | — | TAPD Open Platform OAuth client secret |
| `TAPD_WORKSPACE_ID` | No | — | Default workspace ID |
| `TAPD_API_BASE_URL` | No | `https://api.tapd.cn` | API base URL |
| `LOG_LEVEL` | No | `info` | Log level: `debug` / `info` / `warn` / `error` |

> Only `TAPD_CLIENT_ID` and `TAPD_CLIENT_SECRET` are required. All parameters are injected via the `env` field — no `.env` file needed.

> **Permission issues?** If you encounter API permission errors, go to [TAPD Open Platform App Permissions](https://open.tapd.cn/admin/4002/permission) to configure your app permissions.

---

## Function Reference

### Story Management

| Tool | Description | Required Params |
|---|---|---|
| `tapd_list_stories` | List stories with filters for status, owner, priority, iteration, time range, etc. | `workspace_id` |
| `tapd_get_story` | Get detailed info for a single story | `workspace_id`, `story_id` |
| `tapd_create_story` | Create a new story | `workspace_id`, `name` |
| `tapd_update_story` | Update story fields (status, owner, priority, etc.) | `workspace_id`, `story_id` |
| `tapd_count_stories` | Count stories matching filters | `workspace_id` |
| `tapd_delete_story` | Delete a story | `workspace_id`, `story_id` |

**Usage examples:**

> Show me all unfinished stories in my current iteration
> Create a story "User login page optimization" with high priority in project 12345678
> Change story 1001234 status to "resolved" and assign to Zhang San
> How many stories were created this month?
> List all high-priority stories without an assigned iteration

### Bug Management

| Tool | Description | Required Params |
|---|---|---|
| `tapd_list_bugs` | List bugs with filters for severity, priority, owner, title search, etc. | `workspace_id` |
| `tapd_get_bug` | Get detailed info for a single bug | `workspace_id`, `bug_id` |
| `tapd_create_bug` | Create a new bug | `workspace_id`, `title` |
| `tapd_update_bug` | Update bug fields (status, severity, owner, etc.) | `workspace_id`, `bug_id` |
| `tapd_count_bugs` | Count bugs matching filters | `workspace_id` |
| `tapd_delete_bug` | Delete a bug | `workspace_id`, `bug_id` |

**Usage examples:**

> List all unresolved bugs with fatal or serious severity
> Create a bug: title "Login page crash", severity fatal, assign to Li Si
> Show me bugs created in the last week
> How many open bugs does Zhang San currently have?
> Change bug 2005678 priority to urgent and assign to Wang Wu

### Task Management

| Tool | Description | Required Params |
|---|---|---|
| `tapd_list_tasks` | List tasks with filters for status, owner, creator, iteration, etc. | `workspace_id` |
| `tapd_get_task` | Get detailed info for a single task | `workspace_id`, `task_id` |
| `tapd_create_task` | Create a new task | `workspace_id`, `name` |
| `tapd_update_task` | Update task fields (status, owner, due date, etc.) | `workspace_id`, `task_id` |
| `tapd_count_tasks` | Count tasks matching filters | `workspace_id` |
| `tapd_delete_task` | Delete a task | `workspace_id`, `task_id` |

**Usage examples:**

> List all my tasks in the current iteration
> Create a task "Write API documentation" due next Friday, assign to me
> Mark task 3003456 as completed
> How many tasks are overdue in this project?
> Show me tasks created by Zhang San this week

### Iteration Management

| Tool | Description | Required Params |
|---|---|---|
| `tapd_list_iterations` | List iterations with filters for status, name search, time range | `workspace_id` |
| `tapd_get_iteration` | Get detailed info for a single iteration | `workspace_id`, `iteration_id` |

**Usage examples:**

> List all active iterations in this project
> Show me details for iteration "Sprint 2024-06"
> List iterations created in the last month
> Find all completed iterations

### Workspace Management

| Tool | Description | Required Params |
|---|---|---|
| `tapd_list_workspaces` | List all accessible workspaces for the current account | None |
| `tapd_get_workspace` | Get detailed info for a single workspace | `workspace_id` |

**Usage examples:**

> List all TAPD projects I can access
> Show me details for project 12345678
> Search for projects with "mobile" in the name

### Comment Management

| Tool | Description | Required Params |
|---|---|---|
| `tapd_list_comments` | List comments on a story, bug, or task | `workspace_id`, `entry_type`, `entry_id` |
| `tapd_create_comment` | Add a comment to a story, bug, or task | `workspace_id`, `entry_type`, `entry_id`, `description` |

**Usage examples:**

> Show all comments on story 1001234
> Add a comment to bug 2005678: "Fixed in v2.3.1, please verify"
> Show the discussion history for task 3003456

### Member Management

| Tool | Description | Required Params |
|---|---|---|
| `tapd_list_users` | List workspace members with name search | `workspace_id` |
| `tapd_get_user` | Get detailed info for a single member | `workspace_id`, `user_id` |

**Usage examples:**

> List all members of project 12345678
> Search for members with "Zhang" in their name
> Show details for user zhangsan

### Webhook Management

| Tool | Description | Required Params |
|---|---|---|
| `tapd_list_webhooks` | List configured webhook subscriptions (local and remote) | `workspace_id` |
| `tapd_create_webhook` | Register a new webhook subscription | `workspace_id`, `url`, `events` |
| `tapd_delete_webhook` | Delete a webhook subscription | `webhook_id` |

**Usage examples:**

> Show me all webhooks configured for project 12345678
> Create a webhook to notify https://my-server.com/hook when stories are created or updated
> Delete webhook wh_1

### Image Download

| Tool | Description | Required Params |
|---|---|---|
| `tapd_download_image` | Download TAPD images that require authentication (e.g. prototype screenshots, mockups), returns base64 for AI analysis | `url` |

**Usage examples:**

> The story description has a prototype image — download it and analyze the UI features
> Help me look at the screenshot in this TAPD bug and describe the UI design
> Download this TAPD image https://api.tapd.cn/.../image/... and tell me what it shows
> What error is shown in this bug screenshot? Help me analyze it

### Health Check

| Tool | Description | Required Params |
|---|---|---|
| `tapd_ping` | Check TAPD API connectivity and authentication status | None |

**Usage examples:**

> Check if TAPD connection is working
> Verify that my API credentials are valid

---

## Resources

Quick access to project overview data via `tapd://` URIs:

| URI | Description |
|---|---|
| `tapd://workspaces` | List all accessible workspaces |
| `tapd://workspace/{workspace_id}` | Workspace detail |
| `tapd://stories/{workspace_id}` | Stories overview (top 30) |
| `tapd://bugs/{workspace_id}` | Bugs overview (top 30) |
| `tapd://iterations/{workspace_id}` | Iterations overview |

---

## Prompt Templates

Built-in conversation templates for common workflows:

| Template | Description | How to Use |
|---|---|---|
| `create_bug_from_description` | Parse natural language bug reports into structured bugs with auto-extracted severity and priority | "Use create_bug_from_description to process this bug report: users report a white screen after clicking login..." |
| `sprint_planning` | Analyze unassigned stories and recommend iteration assignments by priority | "Help me with sprint_planning for the next iteration" |
| `daily_standup_report` | Aggregate recent changes into a daily standup report | "Generate my daily standup report with daily_standup_report" |
| `bug_triage` | Analyze unresolved bugs, sort by severity, and suggest priority and assignee | "Run bug_triage to identify critical bugs that need immediate attention" |

---

## Query Filter Reference

All `list` and `count` tools support the following filters:

| Filter Type | Syntax | Example |
|---|---|---|
| Exact match | `field=value` | `priority=high` |
| Enum OR | `field=val1\|val2` | `status=new\|in_progress` |
| Fuzzy search | `field=LIKE<keyword>` | `name=LIKE<login>` |
| Multi-value fuzzy | `field=LIKE_OR<word1\|word2>` | `title=LIKE_OR<crash\|freeze>` |
| Not equal | `field=NOT_EQ<value>` | `status=NOT_EQ<closed>` |
| Multi-user OR | `field=USER_OR<user1\|user2>` | `owner=USER_OR<alice\|bob>` |
| Time range | `field=>date` / `field=<date` / `field=start~end` | `created=>2024-06-01` |
| Multi-ID | `id=1,2,3` | `id=1001,1002,1003` |

**Pagination:** Default 30 per page, max 200. Use `limit` and `page` to navigate, `count` tools for totals.

---

## Development

```bash
git clone git@github.com:jiyi1990118/mcp-tapd-radar.git
cd mcp-tapd-radar
npm install
npm run build       # Compile TypeScript → dist/
npm run dev         # Watch mode
npm start           # Start MCP server (stdio)
npm test            # Run tests (vitest, 39 cases)
npm run lint        # Lint (eslint)
npm run clean       # Clean build artifacts
```

### Publishing

```bash
npm run build
npm publish
```

---

## Links

- [GitHub](https://github.com/jiyi1990118/mcp-tapd-radar) — Source & Issues
- [npm](https://www.npmjs.com/package/@npm_xiyuan/mcp-tapd-radar) — Package registry
- [TAPD API Docs Index](./Docs/tapd文档/README.md) — Authentication, query syntax, API reference
- [AGENTS.md](./AGENTS.md) — Developer contribution guide

## License

[MIT](./LICENSE)
