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

> **权限问题？** 如果遇到 API 权限错误，请前往 [TAPD 开放平台应用权限设置](https://open.tapd.cn/admin/4002/permission) 配置你的应用权限。

---

## 功能手册

### 需求管理 (Story)

| 工具 | 说明 | 必填 |
|---|---|---|
| `tapd_list_stories` | 查询需求列表，支持多种过滤条件 | `workspace_id` |
| `tapd_get_story` | 获取单个需求详细信息（含图片） | `workspace_id`, `story_id` |
| `tapd_create_story` | 创建新需求 | `workspace_id`, `name` |
| `tapd_update_story` | 更新需求字段 | `workspace_id`, `story_id` |
| `tapd_batch_update_stories` | 批量更新多个需求 | `workspace_id`, `story_ids` |
| `tapd_count_stories` | 统计符合条件的需求数量 | `workspace_id` |
| `tapd_delete_story` | 删除需求（设置 status=deleted） | `workspace_id`, `story_id` |

#### 需求创建/更新字段

| 字段 | 类型 | 说明 |
|---|---|---|
| `name` | string | 标题（创建时必填） |
| `description` | string | 详细描述（支持 HTML） |
| `status` | string | 状态，见[需求状态](#需求状态) |
| `v_status` | string | 中文状态名，如 "规划中"（仅更新） |
| `owner` | string | 处理人 |
| `developer` | string | 开发人员 |
| `priority` | string | 优先级 |
| `priority_label` | string | 优先级标签（推荐，支持自定义优先级） |
| `iteration_id` | string | 迭代 ID |
| `begin` | date | 预计开始 (YYYY-MM-DD) |
| `due` | date | 预计结束 (YYYY-MM-DD) |
| `size` | string | 规模 |
| `category_id` | string | 需求分类 ID |
| `workitem_type_id` | string | 需求类别 ID |
| `effort` | string/number | 预估工时（小时/人天） |
| `effort_completed` | string | 完成工时 |
| `remain` | number | 剩余工时 |
| `exceed` | number | 超出工时 |
| `cc` | string | 抄送人 |
| `version` | string | 版本 |
| `module` | string | 模块 |
| `test_focus` | string | 测试重点 |
| `business_value` | number | 业务价值 |
| `source` | string | 来源 |
| `type` | string | 类型 |
| `feature` | string | 特性（仅创建） |
| `tech_risk` | string | 技术风险（仅创建） |
| `release_id` | string | 发布计划 ID |
| `label` | string | 标签（多个以 `\|` 分隔） |
| `parent_id` | string | 父需求 ID（仅创建） |
| `templated_id` | string | 模板 ID（仅创建） |
| `current_user` | string | 变更人（仅更新） |
| `is_auto_close_task` | string | 自动关闭任务：`1`=是（仅更新） |
| `custom_field_one` ~ `custom_field_eight` | string | 自定义字段 1–8 |

#### 需求列表/统计过滤字段

除上述创建/更新字段外，还支持：

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | string | 需求 ID，支持多 ID 查询 |
| `creator` | string | 创建人，支持多人员查询 |
| `with_v_status` | string | 返回中文状态：`1`=是 |
| `include_sub_iteration` | string | 包含子迭代：`0`/`1` |
| `include_sub_category` | string | 包含子分类：`0`/`1` |
| `include_leaf_stories` | string | 包含子需求：`0`/`1` |
| `created` | datetime | 按创建时间过滤 |
| `modified` | datetime | 按修改时间过滤 |
| `completed` | datetime | 按完成时间过滤 |
| `order` | string | 排序规则（如 `created desc`） |
| `fields` | string | 返回字段（逗号分隔） |
| `limit` | number | 每页数量（默认 30，最大 200） |
| `page` | number | 页码（从 1 开始） |

#### 需求响应字段

每个需求响应（`data.item`）中始终返回以下字段：

`id`、`name`、`status`、`priority`、`priority_label`、`owner`、`developer`、`iteration_id`、`begin`、`due`、`effort`、`description`

> `tapd_get_story` 还会在 `raw` 对象中返回 TAPD API 的完整原始数据。

### 缺陷管理 (Bug)

| 工具 | 说明 | 必填 |
|---|---|---|
| `tapd_list_bugs` | 查询缺陷列表，支持多种过滤条件 | `workspace_id` |
| `tapd_get_bug` | 获取单个缺陷详细信息（含图片） | `workspace_id`, `bug_id` |
| `tapd_create_bug` | 创建新缺陷 | `workspace_id`, `title` |
| `tapd_update_bug` | 更新缺陷字段 | `workspace_id`, `bug_id` |
| `tapd_batch_update_bugs` | 批量更新多个缺陷 | `workspace_id`, `bug_ids` |
| `tapd_count_bugs` | 统计符合条件的缺陷数量 | `workspace_id` |
| `tapd_delete_bug` | 删除缺陷（设置 status=deleted） | `workspace_id`, `bug_id` |

#### 缺陷创建/更新字段

| 字段 | 类型 | 说明 |
|---|---|---|
| `title` | string | 标题（创建时必填） |
| `description` | string | 详细描述（含复现步骤） |
| `status` | string | 状态，见[缺陷状态](#缺陷状态) |
| `severity` | string | 严重程度，见[缺陷严重程度](#缺陷严重程度) |
| `priority` | string | 优先级，见[缺陷优先级](#缺陷优先级) |
| `priority_label` | string | 优先级标签（推荐，支持自定义优先级） |
| `current_owner` | string | 当前处理人 |
| `reporter` | string | 报告人 |
| `cc` | string | 抄送人 |
| `module` | string | 模块 |
| `iteration_id` | string | 迭代 ID |
| `deadline` | date | 解决期限 (YYYY-MM-DD) |
| `due` | date | 预计结束 (YYYY-MM-DD) |
| `begin` | date | 预计开始 (YYYY-MM-DD) |
| `platform` | string | 平台 |
| `os` | string | 操作系统 |
| `source` | string | 来源 |
| `resolution` | string | 解决方案 |
| `version_report` | string | 发现版本 |
| `version_test` | string | 测试版本 |
| `version_close` | string | 关闭版本 |
| `baseline_find` | string | 发现基线 |
| `baseline_join` | string | 加入基线 |
| `baseline_test` | string | 测试基线 |
| `baseline_close` | string | 关闭基线 |
| `bugtype` | string | 缺陷类型 |
| `effort` | string | 预估工时 |
| `label` | string | 标签（多个以 `\|` 分隔） |
| `custom_field_one` ~ `custom_field_eight` | string | 自定义字段 1–8 |

#### 缺陷列表/统计过滤字段

除上述创建/更新字段外，还支持：

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | string | 缺陷 ID，支持多 ID 查询 |
| `creator` | string | 创建人，支持多人员查询 |
| `created` | datetime | 按创建时间过滤 |
| `modified` | datetime | 按修改时间过滤 |
| `resolved` | datetime | 按解决时间过滤 |
| `closed` | datetime | 按关闭时间过滤 |
| `order` | string | 排序规则（如 `created desc`） |
| `fields` | string | 返回字段（逗号分隔） |
| `limit` | number | 每页数量（默认 30，最大 200） |
| `page` | number | 页码（从 1 开始） |

#### 缺陷响应字段

每个缺陷响应（`data.item`）中始终返回以下字段：

`id`、`title`、`status`、`severity`、`priority`、`priority_label`、`current_owner`、`iteration_id`、`due`、`description`、`reporter`

### 任务管理 (Task)

| 工具 | 说明 | 必填 |
|---|---|---|
| `tapd_list_tasks` | 查询任务列表，支持多种过滤条件 | `workspace_id` |
| `tapd_get_task` | 获取单个任务详细信息（含图片） | `workspace_id`, `task_id` |
| `tapd_create_task` | 创建新任务 | `workspace_id`, `name` |
| `tapd_update_task` | 更新任务字段 | `workspace_id`, `task_id` |
| `tapd_batch_update_tasks` | 批量更新多个任务 | `workspace_id`, `task_ids` |
| `tapd_count_tasks` | 统计符合条件的任务数量 | `workspace_id` |
| `tapd_delete_task` | 删除任务（设置 status=deleted） | `workspace_id`, `task_id` |

#### 任务创建/更新字段

| 字段 | 类型 | 说明 |
|---|---|---|
| `name` | string | 任务名称（创建时必填） |
| `description` | string | 详细描述 |
| `status` | string | 状态，见[任务状态](#任务状态) |
| `owner` | string | 处理人 |
| `priority` | string | 优先级 |
| `priority_label` | string | 优先级标签（推荐，支持自定义优先级） |
| `iteration_id` | string | 迭代 ID |
| `begin` | date | 预计开始 (YYYY-MM-DD) |
| `due` | date | 预计结束 (YYYY-MM-DD) |
| `category_id` | string | 分类 ID |
| `story_id` | string | 关联需求 ID |
| `effort` | string | 预估工时（小时） |
| `effort_completed` | string | 完成工时 |
| `remain` | number | 剩余工时 |
| `exceed` | number | 超出工时 |
| `cc` | string | 抄送人 |
| `label` | string | 标签（多个以 `\|` 分隔） |
| `custom_field_one` ~ `custom_field_eight` | string | 自定义字段 1–8 |

#### 任务列表/统计过滤字段

除上述创建/更新字段外，还支持：

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | string | 任务 ID，支持多 ID 查询 |
| `creator` | string | 创建人，支持多人员查询 |
| `created` | datetime | 按创建时间过滤 |
| `modified` | datetime | 按修改时间过滤 |
| `completed` | datetime | 按完成时间过滤 |
| `order` | string | 排序规则（如 `created desc`） |
| `fields` | string | 返回字段（逗号分隔） |
| `limit` | number | 每页数量（默认 30，最大 200） |
| `page` | number | 页码（从 1 开始） |

#### 任务响应字段

每个任务响应（`data.item`）中始终返回以下字段：

`id`、`name`、`status`、`priority`、`priority_label`、`owner`、`iteration_id`、`begin`、`due`、`effort`、`description`、`story_id`

---

## 状态与枚举参考

### 需求状态

| 值 | 中文 | 说明 |
|---|---|---|
| `new` | 新建 | 创建时的默认状态 |
| `planning` | 规划中 | 正在评估和规划 |
| `planned` | 需求排期 | 已排期，等待开发 |
| `developing` | 开发中 | 正在开发实现 |
| `testing` | 测试中 | 开发完成，测试验证中 |
| `resolved` | 已解决 | 已实现/已解决 |
| `done` | 已完成 | 全部完成 |
| `closed` | 已关闭 | 已关闭 |
| `reopened` | 重新打开 | 重新打开 |
| `rejected` | 已拒绝 | 被拒绝或放弃 |
| `draft` | 草稿 | 草稿状态 |

> 需求状态值由项目工作流配置决定，不同项目可能不同。上表为最常见状态。可使用 `v_status` 参数按中文状态名查询。

### 缺陷状态

| 值 | 中文 | 说明 |
|---|---|---|
| `new` | 新建 | 新建缺陷 |
| `in_progress` | 处理中 | 正在处理 |
| `resolved` | 已解决 | 已解决 |
| `closed` | 已关闭 | 已关闭 |
| `reopened` | 重新打开 | 重新打开 |
| `rejected` | 已拒绝 | 已拒绝 |
| `postponed` | 延期处理 | 延期处理 |
| `verified` | 已验证 | 已验证 |

### 缺陷严重程度

| 值 | 中文 |
|---|---|
| `fatal` | 致命 |
| `serious` | 严重 |
| `normal` | 一般 |
| `slight` | 轻微 |
| `suggest` | 建议 |

### 缺陷优先级

| 值 | 说明 |
|---|---|
| `urgent` | 紧急 |
| `high` | 高 |
| `medium` | 中 |
| `low` | 低 |
| `insignificant` | 无关紧要 |

### 任务状态

| 值 | 中文 | 说明 |
|---|---|---|
| `open` | 打开 | 新建/打开 |
| `progressing` | 进行中 | 正在执行 |
| `done` | 已完成 | 已完成 |
| `suspended` | 已暂停 | 已暂停 |

> 任务状态值由项目工作流配置决定，不同项目可能不同。上表为最常见状态。

---

## 其他工具

### 迭代管理 (Iteration)

| 工具 | 说明 | 必填 |
|---|---|---|
| `tapd_list_iterations` | 查询迭代列表，支持按名称/状态/时间过滤 | `workspace_id` |
| `tapd_get_iteration` | 获取迭代详情 | `workspace_id`, `iteration_id` |
| `tapd_lock_iteration` | 锁定迭代（需特殊权限） | `workspace_id`, `iteration_id` |
| `tapd_unlock_iteration` | 解锁迭代（需特殊权限） | `workspace_id`, `iteration_id` |

### 项目空间 (Workspace)

| 工具 | 说明 | 必填 |
|---|---|---|
| `tapd_list_workspaces` | 列出可访问的项目空间 | 无 |
| `tapd_get_workspace` | 获取项目空间详情 | `workspace_id` |

### 评论管理 (Comment)

| 工具 | 说明 | 必填 |
|---|---|---|
| `tapd_list_comments` | 查询需求/缺陷/任务的评论列表 | `workspace_id`, `entry_type`, `entry_id` |
| `tapd_create_comment` | 添加评论 | `workspace_id`, `entry_type`, `entry_id`, `description` |

> `entry_type` 取值：`story`、`bug`、`task`

### 成员管理 (User)

| 工具 | 说明 | 必填 |
|---|---|---|
| `tapd_list_users` | 查询项目成员列表 | `workspace_id` |
| `tapd_get_user` | 获取成员详情 | `workspace_id`, `user_id` |

### Webhook 管理（仅本地存储）

> ⚠️ TAPD 开放 API 不提供 Webhook 管理端点。以下工具仅操作本地内存存储，用于记录配置信息。实际的 Webhook 配置需通过 TAPD 网页界面完成。

| 工具 | 说明 | 必填 |
|---|---|---|
| `tapd_list_webhooks` | 列出本地记录的 Webhook 配置 | `workspace_id` |
| `tapd_create_webhook` | 在本地记录 Webhook 配置 | `workspace_id`, `url`, `events` |
| `tapd_delete_webhook` | 删除本地 Webhook 记录 | `webhook_id` |

### 图片下载 (Image)

| 工具 | 说明 | 必填 |
|---|---|---|
| `tapd_download_image` | 下载需要认证的 TAPD 图片（原型图、截图），返回 base64 供 AI 分析 | `url` |

> `tapd_get_story`、`tapd_get_bug`、`tapd_get_task` 会自动下载描述中的前 3 张图片。如需下载更多图片，请使用此工具。

### 健康检查

| 工具 | 说明 | 必填 |
|---|---|---|
| `tapd_ping` | 检查 TAPD API 连通性和认证状态 | 无 |

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
| 不等于 | `field=NOT_EQ<值>` 或 `<>值` | `status=NOT_EQ<closed>` |
| 多用户 | `field=USER_OR<用户1\|用户2>` | `owner=USER_OR<张三\|李四>` |
| 时间范围 | `>日期`、`<日期`、`日期~日期` | `created=>2024-06-01` |
| 多 ID | `id=1,2,3` | `id=1001,1002,1003` |

**分页：** 默认每页 30 条，最大 200 条。使用 `limit` 和 `page` 参数翻页，通过 `count` 类工具获取总数。

---

## 使用示例

以下是可直接对 AI 助手使用的自然语言示例：

**需求管理：**
> 查看我当前迭代中所有未完成的需求
> 帮我在项目中创建一个名为"用户登录优化"的需求，优先级为高，开发人员张三
> 把需求 1001234 的状态改为"已实现"，处理人改为李四
> 统计一下这个月新增了多少需求
> 列出所有高优先级但没有分配开发人员的需求
> 更新需求 1001234：预估工时改为 16 小时，优先级标签改为 High

**缺陷管理：**
> 列出所有致命和严重级别的未解决缺陷
> 创建一个缺陷：标题"登录崩溃"，严重程度致命，报告人张三，预计结束 2026-07-01
> 查看最近一周新增了哪些缺陷
> 统计张三当前手上有多少个未关闭的缺陷
> 把缺陷 2005678 的优先级改为紧急，抄送李四

**任务管理：**
> 列出我在当前迭代中的所有任务
> 创建一个任务"编写 API 文档"，截止日期为下周五，分配给我
> 创建关联需求 1001234 的任务，预估工时 8 小时
> 把任务 3003456 标记为已完成
> 统计项目中有多少任务逾期未完成

**迭代管理：**
> 列出当前项目所有进行中的迭代
> 查看迭代"Sprint 2024-06"的详细信息
> 锁定迭代"Sprint Q1"

**评论与成员：**
> 查看需求 1001234 的所有评论
> 在缺陷 2005678 下添加评论："已在 v2.3.1 修复，请验证"
> 列出项目的所有成员

---

## 开发

```bash
git clone git@github.com:jiyi1990118/mcp-tapd-radar.git
cd mcp-tapd-radar
npm install
npm run build       # 编译 TypeScript → dist/
npm run dev         # 监听模式编译
npm start           # 启动 MCP 服务（stdio）
npm test            # 运行测试（vitest，51 个用例）
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
