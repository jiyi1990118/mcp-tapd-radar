# mcp-tapd-radar

[![npm version](https://img.shields.io/npm/v/@npm_xiyuan/mcp-tapd-radar.svg)](https://www.npmjs.com/package/@npm_xiyuan/mcp-tapd-radar)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![MCP SDK](https://img.shields.io/badge/MCP_SDK-1.29-purple)](https://github.com/modelcontextprotocol/typescript-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

TAPD（腾讯敏捷产品研发平台）的 [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) 服务。让 AI 助手通过自然语言与 TAPD 的需求、缺陷、任务、迭代等数据交互。

**[English](./README.md)** | 中文

---

## 安装与配置

### 方式一：npx 直接运行（推荐）

在 MCP 客户端配置文件中添加（如 `claude_desktop_config.json`、`mcp.json`）：

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

> `npx` 会自动下载并运行最新版本，无需手动安装。

### 方式二：全局安装

```bash
npm install -g @npm_xiyuan/mcp-tapd-radar
```

配置中使用：

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

### 方式三：源码安装

```bash
git clone git@github.com:jiyi1990118/mcp-tapd-radar.git
cd mcp-tapd-radar
npm install
npm run build
```

配置中使用：

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

### 环境变量

| 变量 | 必需 | 默认值 | 说明 |
|---|---|---|---|
| `TAPD_CLIENT_ID` | **是** | — | TAPD 开放平台 OAuth 客户端 ID |
| `TAPD_CLIENT_SECRET` | **是** | — | TAPD 开放平台 OAuth 客户端密钥 |
| `TAPD_WORKSPACE_ID` | 否 | — | 默认项目空间 ID |
| `TAPD_API_BASE_URL` | 否 | `https://api.tapd.cn` | API 基础地址 |
| `LOG_LEVEL` | 否 | `info` | 日志级别：`debug` / `info` / `warn` / `error` |

> 仅 `TAPD_CLIENT_ID` 和 `TAPD_CLIENT_SECRET` 为必填，其余可选。所有参数通过 `env` 字段注入，无需 `.env` 文件。

---

## 功能手册

### 需求管理 (Story)

| 工具 | 说明 | 必填参数 |
|---|---|---|
| `tapd_list_stories` | 查询需求列表，支持按状态、处理人、优先级、迭代、时间范围等过滤 | `workspace_id` |
| `tapd_get_story` | 获取单个需求的详细信息 | `workspace_id`, `story_id` |
| `tapd_create_story` | 创建新需求 | `workspace_id`, `name` |
| `tapd_update_story` | 更新需求字段（状态、处理人、优先级等） | `workspace_id`, `story_id` |
| `tapd_count_stories` | 统计符合条件的需求数量 | `workspace_id` |
| `tapd_delete_story` | 删除需求 | `workspace_id`, `story_id` |

**应用场景示例：**

> 查看我当前迭代中所有未完成的需求
> 帮我在项目 12345678 中创建一个名为"用户登录页面优化"的需求，优先级为高
> 把需求 1001234 的状态改为"已实现"，处理人改为张三
> 统计一下这个月新增了多少需求
> 列出所有高优先级且没有分配迭代的需求

### 缺陷管理 (Bug)

| 工具 | 说明 | 必填参数 |
|---|---|---|
| `tapd_list_bugs` | 查询缺陷列表，支持按严重程度、优先级、处理人、标题模糊搜索等过滤 | `workspace_id` |
| `tapd_get_bug` | 获取单个缺陷的详细信息 | `workspace_id`, `bug_id` |
| `tapd_create_bug` | 创建新缺陷 | `workspace_id`, `title` |
| `tapd_update_bug` | 更新缺陷字段（状态、严重程度、处理人等） | `workspace_id`, `bug_id` |
| `tapd_count_bugs` | 统计符合条件的缺陷数量 | `workspace_id` |
| `tapd_delete_bug` | 删除缺陷 | `workspace_id`, `bug_id` |

**应用场景示例：**

> 列出所有致命和严重级别的未解决缺陷
> 帮我创建一个缺陷：标题"登录页面崩溃"，严重程度为致命，处理人李四
> 查看最近一周新增了哪些缺陷
> 统计张三当前手上有多少个未关闭的缺陷
> 把缺陷 2005678 的优先级改为紧急，处理人改为王五

### 任务管理 (Task)

| 工具 | 说明 | 必填参数 |
|---|---|---|
| `tapd_list_tasks` | 查询任务列表，支持按状态、处理人、创建人、迭代等过滤 | `workspace_id` |
| `tapd_get_task` | 获取单个任务的详细信息 | `workspace_id`, `task_id` |
| `tapd_create_task` | 创建新任务 | `workspace_id`, `name` |
| `tapd_update_task` | 更新任务字段（状态、处理人、截止日期等） | `workspace_id`, `task_id` |
| `tapd_count_tasks` | 统计符合条件的任务数量 | `workspace_id` |
| `tapd_delete_task` | 删除任务 | `workspace_id`, `task_id` |

**应用场景示例：**

> 列出我在当前迭代中的所有任务
> 创建一个任务"编写 API 文档"，截止日期为下周五，分配给我
> 把任务 3003456 的状态标记为已完成
> 统计项目中有多少任务逾期未完成
> 查看张三本周创建了哪些任务

### 迭代管理 (Iteration)

| 工具 | 说明 | 必填参数 |
|---|---|---|
| `tapd_list_iterations` | 查询迭代列表，支持按状态、名称搜索、时间范围过滤 | `workspace_id` |
| `tapd_get_iteration` | 获取单个迭代的详细信息 | `workspace_id`, `iteration_id` |

**应用场景示例：**

> 列出当前项目所有进行中的迭代
> 查看迭代"Sprint 2024-06"的详细信息
> 列出最近一个月创建的迭代
> 找出所有已结束的迭代

### 项目空间 (Workspace)

| 工具 | 说明 | 必填参数 |
|---|---|---|
| `tapd_list_workspaces` | 列出当前账号可访问的所有项目空间 | 无 |
| `tapd_get_workspace` | 获取单个项目空间的详细信息 | `workspace_id` |

**应用场景示例：**

> 列出我能访问的所有 TAPD 项目
> 查看项目 12345678 的基本信息
> 搜索名称包含"客户端"的项目

### 评论管理 (Comment)

| 工具 | 说明 | 必填参数 |
|---|---|---|
| `tapd_list_comments` | 查询需求/缺陷/任务的评论列表 | `workspace_id`, `entry_type`, `entry_id` |
| `tapd_create_comment` | 为需求/缺陷/任务添加评论 | `workspace_id`, `entry_type`, `entry_id`, `description` |

**应用场景示例：**

> 查看需求 1001234 的所有评论
> 在缺陷 2005678 下添加评论："已在 v2.3.1 修复，请验证"
> 查看任务 3003456 的讨论记录

### 成员管理 (User)

| 工具 | 说明 | 必填参数 |
|---|---|---|
| `tapd_list_users` | 查询项目成员列表，支持按名称搜索 | `workspace_id` |
| `tapd_get_user` | 获取单个成员的详细信息 | `workspace_id`, `user_id` |

**应用场景示例：**

> 列出项目 12345678 的所有成员
> 搜索项目中名字包含"张"的成员
> 查看用户 zhangsan 的详细信息

### Webhook 管理

| 工具 | 说明 | 必填参数 |
|---|---|---|
| `tapd_list_webhooks` | 列出已配置的 Webhook 订阅（含本地和远程） | `workspace_id` |
| `tapd_create_webhook` | 注册新的 Webhook 订阅 | `workspace_id`, `url`, `events` |
| `tapd_delete_webhook` | 删除 Webhook 订阅 | `webhook_id` |

**应用场景示例：**

> 查看项目 12345678 配置了哪些 Webhook
> 创建一个 Webhook：当需求创建或更新时通知 https://my-server.com/hook
> 删除 Webhook wh_1

### 健康检查

| 工具 | 说明 | 必填参数 |
|---|---|---|
| `tapd_ping` | 检查 TAPD API 连通性和认证状态 | 无 |

**应用场景示例：**

> 检查 TAPD 连接是否正常
> 验证 API 认证凭据是否有效

---

## 资源 (Resources)

通过 `tapd://` URI 快速访问项目概览数据：

| URI | 说明 |
|---|---|
| `tapd://workspaces` | 所有可访问的项目空间列表 |
| `tapd://workspace/{workspace_id}` | 指定项目空间的详细信息 |
| `tapd://stories/{workspace_id}` | 项目需求概览（前 30 条） |
| `tapd://bugs/{workspace_id}` | 项目缺陷概览（前 30 条） |
| `tapd://iterations/{workspace_id}` | 项目迭代概览 |

---

## 提示模板 (Prompts)

预置的对话模板，可直接使用：

| 模板名称 | 说明 | 使用方式 |
|---|---|---|
| `create_bug_from_description` | 从自然语言描述自动提取标题、严重程度、优先级并创建结构化缺陷 | "用 create_bug_from_description 帮我处理这段缺陷描述：用户反馈点击登录按钮后页面白屏..." |
| `sprint_planning` | 分析未分配迭代的需求，按优先级推荐迭代分配方案 | "帮我做一下 sprint_planning，看看下个迭代应该排哪些需求" |
| `daily_standup_report` | 汇总最近的变更记录，生成每日站会报告 | "用 daily_standup_report 生成我今天的站会报告" |
| `bug_triage` | 分析未处理缺陷，按严重程度排序并建议处理人和优先级 | "帮我做一下 bug_triage，看看有哪些紧急缺陷需要处理" |

---

## 查询过滤参考

所有 `list` 和 `count` 类工具支持以下过滤方式：

| 过滤类型 | 用法 | 示例 |
|---|---|---|
| 精确匹配 | `field=value` | `priority=high` |
| 枚举多选 | `field=val1\|val2` | `status=new\|in_progress` |
| 模糊搜索 | `field=LIKE<关键词>` | `name=LIKE<登录>` |
| 多值模糊 | `field=LIKE_OR<词1\|词2>` | `title=LIKE_OR<崩溃\|闪退>` |
| 不等于 | `field=NOT_EQ<值>` | `status=NOT_EQ<closed>` |
| 多用户 | `field=USER_OR<用户1\|用户2>` | `owner=USER_OR<张三\|李四>` |
| 时间范围 | `field=>日期` / `field=<日期` / `field=开始~结束` | `created=>2024-06-01` |
| 多 ID | `id=1,2,3` | `id=1001,1002,1003` |

**分页：** 默认每页 30 条，最大 200 条。使用 `limit` 和 `page` 参数翻页，通过 `count` 类工具获取总数。

---

## 开发

```bash
git clone git@github.com:jiyi1990118/mcp-tapd-radar.git
cd mcp-tapd-radar
npm install
npm run build       # 编译 TypeScript → dist/
npm run dev         # 监听模式编译
npm start           # 启动 MCP 服务（stdio）
npm test            # 运行测试（vitest，39 个用例）
npm run lint        # 代码检查（eslint）
npm run clean       # 清理构建产物
```

### 发布

```bash
npm run build
npm publish          # 发布至 npm
```

---

## 链接

- [GitHub](https://github.com/jiyi1990118/mcp-tapd-radar) — 源码与 Issue
- [npm](https://www.npmjs.com/package/@npm_xiyuan/mcp-tapd-radar) — 包发布
- [TAPD API 文档索引](./Docs/tapd文档/README.md) — 认证方式、查询语法、API 参考
- [AGENTS.md](./AGENTS.md) — 开发者贡献指南

## License

[MIT](./LICENSE)
