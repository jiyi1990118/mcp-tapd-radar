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

### Story Management / 需求管理

| Tool | Description | Required |
|---|---|---|
| `tapd_list_stories` | List stories with extensive filters | `workspace_id` |
| `tapd_get_story` | Get a single story with full detail + images | `workspace_id`, `story_id` |
| `tapd_create_story` | Create a new story | `workspace_id`, `name` |
| `tapd_update_story` | Update story fields | `workspace_id`, `story_id` |
| `tapd_batch_update_stories` | Batch update multiple stories | `workspace_id`, `story_ids` |
| `tapd_count_stories` | Count stories matching filters | `workspace_id` |
| `tapd_delete_story` | Delete a story (sets status=deleted) | `workspace_id`, `story_id` |

#### Story Create/Update Fields

| Field | Chinese | Type | Description |
|---|---|---|---|
| `name` | 标题 | string | Story title (required for create) |
| `description` | 详细描述 | string | Story description (HTML supported) |
| `status` | 状态 | string | See [Story Status](#story-status) |
| `v_status` | 状态(中文) | string | Chinese status name, e.g. "规划中" (update only) |
| `owner` | 处理人 | string | Handler/owner username |
| `developer` | 开发人员 | string | Developer assigned |
| `priority` | 优先级 | string | Priority value |
| `priority_label` | 优先级(推荐) | string | Priority label (recommended, supports custom priorities) |
| `iteration_id` | 迭代ID | string | Target iteration ID |
| `begin` | 预计开始 | date | Planned start date (YYYY-MM-DD) |
| `due` | 预计结束 | date | Planned end date (YYYY-MM-DD) |
| `size` | 规模 | string | Story size/scale |
| `category_id` | 需求分类 | string | Story category ID |
| `workitem_type_id` | 需求类别 | string | Work item type ID |
| `effort` | 预估工时 | string/number | Estimated effort (work hours) |
| `effort_completed` | 完成工时 | string | Completed effort |
| `remain` | 剩余工时 | number | Remaining effort |
| `exceed` | 超出工时 | number | Exceeded effort |
| `cc` | 抄送人 | string | CC/copy-to users |
| `version` | 版本 | string | Version |
| `module` | 模块 | string | Module |
| `test_focus` | 测试重点 | string | Test focus area |
| `business_value` | 业务价值 | number | Business value score |
| `source` | 来源 | string | Source of the story |
| `type` | 类型 | string | Type classification |
| `feature` | 特性 | string | Feature tag (create only) |
| `tech_risk` | 技术风险 | string | Technical risk assessment (create only) |
| `release_id` | 发布计划 | string | Release plan ID |
| `label` | 标签 | string | Labels (multiple separated by `\|`) |
| `parent_id` | 父需求ID | string | Parent story ID (create only) |
| `templated_id` | 模板ID | string | Template ID (create only) |
| `current_user` | 变更人 | string | Change author (update only) |
| `is_auto_close_task` | 自动关闭任务 | string | Auto-close tasks: `1`=yes (update only) |
| `custom_field_one` ~ `custom_field_eight` | 自定义字段 | string | Custom fields 1–8 |

#### Story List/Count Filter Fields

All Story Create/Update fields above, plus:

| Field | Chinese | Type | Description |
|---|---|---|---|
| `id` | 需求ID | string | Story ID, supports multi-ID query |
| `creator` | 创建人 | string | Creator, supports multi-user query |
| `with_v_status` | 返回中文状态 | string | Return Chinese status: `1`=yes |
| `include_sub_iteration` | 包含子迭代 | string | Include sub-iterations: `0`/`1` |
| `include_sub_category` | 包含子分类 | string | Include sub-categories: `0`/`1` |
| `include_leaf_stories` | 包含子需求 | string | Include child stories: `0`/`1` |
| `created` | 创建时间 | datetime | Filter by creation time |
| `modified` | 最后修改时间 | datetime | Filter by modification time |
| `completed` | 完成时间 | datetime | Filter by completion time |
| `order` | 排序规则 | string | Sort order (e.g. `created desc`) |
| `fields` | 返回字段 | string | Comma-separated fields to return |
| `limit` | 每页数量 | number | Results per page (default 30, max 200) |
| `page` | 页码 | number | Page number (starts from 1) |

#### Story Response Fields

The following fields are returned in every story response (`data.item`):

`id`, `name`, `status`, `priority`, `priority_label`, `owner`, `developer`, `iteration_id`, `begin`, `due`, `effort`, `description`

> For `tapd_get_story`, the full raw TAPD response with all fields is also included in the `raw` object.

### Bug Management / 缺陷管理

| Tool | Description | Required |
|---|---|---|
| `tapd_list_bugs` | List bugs with extensive filters | `workspace_id` |
| `tapd_get_bug` | Get a single bug with full detail + images | `workspace_id`, `bug_id` |
| `tapd_create_bug` | Create a new bug | `workspace_id`, `title` |
| `tapd_update_bug` | Update bug fields | `workspace_id`, `bug_id` |
| `tapd_batch_update_bugs` | Batch update multiple bugs | `workspace_id`, `bug_ids` |
| `tapd_count_bugs` | Count bugs matching filters | `workspace_id` |
| `tapd_delete_bug` | Delete a bug (sets status=deleted) | `workspace_id`, `bug_id` |

#### Bug Create/Update Fields

| Field | Chinese | Type | Description |
|---|---|---|---|
| `title` | 标题 | string | Bug title (required for create) |
| `description` | 详细描述 | string | Bug description with steps to reproduce |
| `status` | 状态 | string | See [Bug Status](#bug-status) |
| `severity` | 严重程度 | string | See [Bug Severity](#bug-severity) |
| `priority` | 优先级 | string | See [Bug Priority](#bug-priority) |
| `priority_label` | 优先级(推荐) | string | Priority label (supports custom priorities) |
| `current_owner` | 当前处理人 | string | Current handler |
| `reporter` | 报告人 | string | Reporter of the bug |
| `cc` | 抄送人 | string | CC/copy-to users |
| `module` | 模块 | string | Module name |
| `iteration_id` | 迭代ID | string | Target iteration ID |
| `deadline` | 解决期限 | date | Resolution deadline (YYYY-MM-DD) |
| `due` | 预计结束 | date | Planned end date (YYYY-MM-DD) |
| `begin` | 预计开始 | date | Planned start date (YYYY-MM-DD) |
| `platform` | 平台 | string | Platform information |
| `os` | 操作系统 | string | Operating system |
| `source` | 来源 | string | Bug source |
| `resolution` | 解决方案 | string | Resolution status |
| `version_report` | 发现版本 | string | Version where bug was found |
| `version_test` | 测试版本 | string | Version for testing |
| `version_close` | 关闭版本 | string | Version where bug was closed |
| `baseline_find` | 发现基线 | string | Baseline where found |
| `baseline_join` | 加入基线 | string | Baseline when joined |
| `baseline_test` | 测试基线 | string | Baseline for testing |
| `baseline_close` | 关闭基线 | string | Baseline when closed |
| `bugtype` | 缺陷类型 | string | Bug type classification |
| `effort` | 预估工时 | string | Estimated effort |
| `label` | 标签 | string | Labels (multiple separated by `\|`) |
| `custom_field_one` ~ `custom_field_eight` | 自定义字段 | string | Custom fields 1–8 |

#### Bug List/Count Filter Fields

All Bug Create/Update fields above, plus:

| Field | Chinese | Type | Description |
|---|---|---|---|
| `id` | 缺陷ID | string | Bug ID, supports multi-ID query |
| `creator` | 创建人 | string | Creator, supports multi-user query |
| `created` | 创建时间 | datetime | Filter by creation time |
| `modified` | 最后修改时间 | datetime | Filter by modification time |
| `resolved` | 解决时间 | datetime | Filter by resolution time |
| `closed` | 关闭时间 | datetime | Filter by close time |
| `order` | 排序规则 | string | Sort order (e.g. `created desc`) |
| `fields` | 返回字段 | string | Comma-separated fields to return |
| `limit` | 每页数量 | number | Results per page (default 30, max 200) |
| `page` | 页码 | number | Page number (starts from 1) |

#### Bug Response Fields

The following fields are returned in every bug response (`data.item`):

`id`, `title`, `status`, `severity`, `priority`, `priority_label`, `current_owner`, `iteration_id`, `due`, `description`, `reporter`

### Task Management / 任务管理

| Tool | Description | Required |
|---|---|---|
| `tapd_list_tasks` | List tasks with extensive filters | `workspace_id` |
| `tapd_get_task` | Get a single task with full detail + images | `workspace_id`, `task_id` |
| `tapd_create_task` | Create a new task | `workspace_id`, `name` |
| `tapd_update_task` | Update task fields | `workspace_id`, `task_id` |
| `tapd_batch_update_tasks` | Batch update multiple tasks | `workspace_id`, `task_ids` |
| `tapd_count_tasks` | Count tasks matching filters | `workspace_id` |
| `tapd_delete_task` | Delete a task (sets status=deleted) | `workspace_id`, `task_id` |

#### Task Create/Update Fields

| Field | Chinese | Type | Description |
|---|---|---|---|
| `name` | 任务名称 | string | Task name (required for create) |
| `description` | 详细描述 | string | Task description |
| `status` | 状态 | string | See [Task Status](#task-status) |
| `owner` | 处理人 | string | Handler/owner |
| `priority` | 优先级 | string | Priority value |
| `priority_label` | 优先级(推荐) | string | Priority label (supports custom priorities) |
| `iteration_id` | 迭代ID | string | Target iteration ID |
| `begin` | 预计开始 | date | Planned start date (YYYY-MM-DD) |
| `due` | 预计结束 | date | Planned end date (YYYY-MM-DD) |
| `category_id` | 分类ID | string | Category ID |
| `story_id` | 关联需求ID | string | Related story ID |
| `effort` | 预估工时 | string | Estimated effort (work hours) |
| `effort_completed` | 完成工时 | string | Completed effort |
| `remain` | 剩余工时 | number | Remaining effort |
| `exceed` | 超出工时 | number | Exceeded effort |
| `cc` | 抄送人 | string | CC/copy-to users |
| `label` | 标签 | string | Labels (multiple separated by `\|`) |
| `custom_field_one` ~ `custom_field_eight` | 自定义字段 | string | Custom fields 1–8 |

#### Task List/Count Filter Fields

All Task Create/Update fields above, plus:

| Field | Chinese | Type | Description |
|---|---|---|---|
| `id` | 任务ID | string | Task ID, supports multi-ID query |
| `creator` | 创建人 | string | Creator, supports multi-user query |
| `created` | 创建时间 | datetime | Filter by creation time |
| `modified` | 最后修改时间 | datetime | Filter by modification time |
| `completed` | 完成时间 | datetime | Filter by completion time |
| `order` | 排序规则 | string | Sort order (e.g. `created desc`) |
| `fields` | 返回字段 | string | Comma-separated fields to return |
| `limit` | 每页数量 | number | Results per page (default 30, max 200) |
| `page` | 页码 | number | Page number (starts from 1) |

#### Task Response Fields

The following fields are returned in every task response (`data.item`):

`id`, `name`, `status`, `priority`, `priority_label`, `owner`, `iteration_id`, `begin`, `due`, `effort`, `description`, `story_id`

---

## Status & Enum Reference

### Story Status

| Value | Chinese | Description |
|---|---|---|
| `new` | 新建 | Default when created |
| `planning` | 规划中 | Being evaluated and planned |
| `planned` | 需求排期 | Scheduled, awaiting development |
| `developing` | 开发中 | Under active development |
| `testing` | 测试中 | Dev complete, in QA verification |
| `resolved` | 已解决 | Implementation finished |
| `done` | 已完成 | Fully complete |
| `closed` | 已关闭 | Closed |
| `reopened` | 重新打开 | Re-opened after closure |
| `rejected` | 已拒绝 | Rejected or abandoned |
| `draft` | 草稿 | Draft state |

> Story status values are workflow-configurable per project. The above are the most common. Use `v_status` parameter for Chinese status names.

### Bug Status

| Value | Chinese | Description |
|---|---|---|
| `new` | 新建 | Newly created |
| `in_progress` | 处理中 | Being handled |
| `resolved` | 已解决 | Resolved |
| `closed` | 已关闭 | Closed |
| `reopened` | 重新打开 | Re-opened |
| `rejected` | 已拒绝 | Rejected |
| `postponed` | 延期处理 | Postponed |
| `verified` | 已验证 | Verified |

### Bug Severity

| Value | Chinese |
|---|---|
| `fatal` | 致命 |
| `serious` | 严重 |
| `normal` | 一般 |
| `slight` | 轻微 |
| `suggest` | 建议 |

### Bug Priority

| Value | Description |
|---|---|
| `urgent` | Urgent |
| `high` | High |
| `medium` | Medium |
| `low` | Low |
| `insignificant` | Insignificant |

### Task Status

| Value | Chinese | Description |
|---|---|---|
| `open` | 打开 | Open/New |
| `progressing` | 进行中 | In progress |
| `done` | 已完成 | Completed |
| `suspended` | 已暂停 | Suspended |

> Task status values are workflow-configurable per project. The above are the most common.

---

## Other Tools

### Iteration Management / 迭代管理

| Tool | Description | Required |
|---|---|---|
| `tapd_list_iterations` | List iterations with name/status/time filters | `workspace_id` |
| `tapd_get_iteration` | Get iteration detail | `workspace_id`, `iteration_id` |
| `tapd_lock_iteration` | Lock iteration (requires special permission) | `workspace_id`, `iteration_id` |
| `tapd_unlock_iteration` | Unlock iteration (requires special permission) | `workspace_id`, `iteration_id` |

### Workspace Management / 项目空间

| Tool | Description | Required |
|---|---|---|
| `tapd_list_workspaces` | List accessible workspaces | None |
| `tapd_get_workspace` | Get workspace detail | `workspace_id` |

### Comment Management / 评论管理

| Tool | Description | Required |
|---|---|---|
| `tapd_list_comments` | List comments on a story/bug/task | `workspace_id`, `entry_type`, `entry_id` |
| `tapd_create_comment` | Add a comment to a story/bug/task | `workspace_id`, `entry_type`, `entry_id`, `description` |

> `entry_type` values: `story`, `bug`, `task`

### Member Management / 成员管理

| Tool | Description | Required |
|---|---|---|
| `tapd_list_users` | List workspace members | `workspace_id` |
| `tapd_get_user` | Get user detail | `workspace_id`, `user_id` |

### Webhook Management / Webhook 管理 (Local-only)

> ⚠️ TAPD Open API does not expose webhook management endpoints. These tools operate on a local in-memory store for configuration tracking only. Actual webhook setup must be done via the TAPD web UI.

| Tool | Description | Required |
|---|---|---|
| `tapd_list_webhooks` | List local webhook records | `workspace_id` |
| `tapd_create_webhook` | Record a webhook config locally | `workspace_id`, `url`, `events` |
| `tapd_delete_webhook` | Remove a local webhook record | `webhook_id` |

### Image Download / 图片下载

| Tool | Description | Required |
|---|---|---|
| `tapd_download_image` | Download TAPD images requiring auth (prototype screenshots, mockups), returns base64 for AI analysis | `url` |

> `tapd_get_story`, `tapd_get_bug`, `tapd_get_task` auto-download up to 3 images from descriptions. Use this tool for additional images.

### Health Check / 健康检查

| Tool | Description | Required |
|---|---|---|
| `tapd_ping` | Check TAPD API connectivity and authentication | None |

---

## Resources

Quick access to project overview data via `tapd://` URIs:

| URI | Description |
|---|---|
| `tapd://workspaces` | All accessible workspaces |
| `tapd://workspace/{workspace_id}` | Workspace detail |
| `tapd://stories/{workspace_id}` | Stories overview (top 30) |
| `tapd://bugs/{workspace_id}` | Bugs overview (top 30) |
| `tapd://iterations/{workspace_id}` | Iterations overview |

---

## Prompt Templates

Built-in conversation templates for common workflows:

| Template | Description | How to Use |
|---|---|---|
| `create_bug_from_description` | Parse natural language bug reports into structured bugs | "Use create_bug_from_description to process this bug report: users report a white screen after clicking login..." |
| `sprint_planning` | Analyze unassigned stories and recommend iteration assignments | "Help me with sprint_planning for the next iteration" |
| `daily_standup_report` | Aggregate recent changes into a daily standup report | "Generate my daily standup report with daily_standup_report" |
| `bug_triage` | Analyze unresolved bugs, sort by severity, suggest assignee | "Run bug_triage to identify critical bugs that need immediate attention" |

---

## Query Filter Reference

All `list` and `count` tools support the following filter operators:

| Filter Type | Syntax | Example |
|---|---|---|
| Exact match | `field=value` | `priority=high` |
| Enum OR | `field=val1\|val2` | `status=new\|in_progress` |
| Fuzzy search | `field=LIKE<keyword>` | `name=LIKE<login>` |
| Multi-value fuzzy | `field=LIKE_OR<word1\|word2>` | `title=LIKE_OR<crash\|freeze>` |
| Not equal | `field=NOT_EQ<value>` or `<>value` | `status=NOT_EQ<closed>` |
| Multi-user OR | `field=USER_OR<user1\|user2>` | `owner=USER_OR<alice\|bob>` |
| Time range | `>date`, `<date`, `date~date` | `created=>2024-06-01` |
| Multi-ID | `id=1,2,3` | `id=1001,1002,1003` |

**Pagination:** Default 30 per page, max 200. Use `limit` and `page` to navigate, `count` tools for totals.

---

## Usage Examples

Here are natural language examples you can use with your AI assistant:

**Stories:**
> Show me all unfinished stories in my current iteration
> Create a story "User login optimization" with high priority, developer 张三
> Change story 1001234 status to "resolved" and assign to 李四
> How many stories were created this month?
> List all high-priority stories without a developer assigned
> Update story 1001234: set effort to 16 hours, priority_label to High

**Bugs:**
> List all unresolved bugs with fatal or serious severity
> Create a bug: title "Login crash", severity fatal, reporter 张三, due 2026-07-01
> Show me bugs created in the last week
> How many open bugs does 张三 currently have?
> Change bug 2005678 priority to urgent, cc 李四

**Tasks:**
> List all my tasks in the current iteration
> Create a task "Write API docs" due next Friday, assign to me
> Create a task linked to story 1001234 with effort 8 hours
> Mark task 3003456 as completed
> How many tasks are overdue in this project?

**Iterations:**
> List all active iterations
> Show me details for iteration "Sprint 2024-06"
> Lock iteration "Sprint Q1"

**Comments & Users:**
> Show all comments on story 1001234
> Add a comment to bug 2005678: "Fixed in v2.3.1, please verify"
> List all members of project 12345678

---

## Development

```bash
git clone git@github.com:jiyi1990118/mcp-tapd-radar.git
cd mcp-tapd-radar
npm install
npm run build       # Compile TypeScript → dist/
npm run dev         # Watch mode
npm start           # Start MCP server (stdio)
npm test            # Run tests (vitest, 51 cases)
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
