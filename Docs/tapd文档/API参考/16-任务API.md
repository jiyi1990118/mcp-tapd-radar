# 任务 (Task) API 参考

本文档包含TAPD任务相关的所有API接口。

## API列表

### 基础操作
- 创建任务: `POST /tasks`
- 获取任务: `GET /tasks`
- 更新任务: `POST /tasks`
- 批量更新任务: `POST /tasks/batch_update_task`
- 获取任务数量: `GET /tasks/count`

### 任务变更
- 获取任务变更历史: `GET /tasks/changes`
- 获取任务变更次数: `GET /tasks/changes/count`

### 任务配置
- 获取任务自定义字段配置: `GET /tasks/custom_fields_settings`
- 获取任务字段信息: `GET /tasks/fields_info`

### 任务视图
- 获取视图对应的任务列表: `GET /tasks/get_tasks_by_view_conf_id`

### 任务回收站
- 获取回收站的任务: `GET /tasks/removed`

## 核心API详解

### 创建任务

**URL**: `POST https://api.tapd.cn/tasks`

**请求参数**:

| 字段名 | 必选 | 类型 | 说明 |
|--------|------|------|------|
| workspace_id | 是 | integer | 项目ID |
| name | 是 | string | 任务名称 |
| owner | 否 | string | 处理人 |
| status | 否 | string | 状态 |
| priority | 否 | string | 优先级 |
| begin | 否 | date | 预计开始 |
| due | 否 | date | 预计结束 |
| iteration_id | 否 | string | 迭代ID |
| story_id | 否 | string | 关联需求ID |
| description | 否 | string | 详细描述 |
| effort | 否 | string | 预估工时 |
| effort_completed | 否 | string | 完成工时 |
| remain | 否 | float | 剩余工时 |
| exceed | 否 | float | 超出工时 |
| custom_field_* | 否 | string/integer | 自定义字段 |

### 获取任务

**URL**: `GET https://api.tapd.cn/tasks`

**请求参数**:

| 字段名 | 必选 | 类型 | 说明 | 特殊规则 |
|--------|------|------|------|----------|
| workspace_id | 是 | integer | 项目ID | |
| id | 否 | integer | 任务ID | 支持多ID查询 |
| name | 否 | string | 任务名称 | 支持模糊匹配 |
| status | 否 | string | 状态 | 支持枚举查询 |
| priority | 否 | string | 优先级 | 支持枚举查询 |
| owner | 否 | string | 处理人 | 支持模糊匹配 |
| creator | 否 | string | 创建人 | 支持多人员查询 |
| iteration_id | 否 | string | 迭代ID | 支持不等于或枚举 |
| story_id | 否 | string | 关联需求ID | |
| created | 否 | datetime | 创建时间 | 支持时间查询 |
| modified | 否 | datetime | 最后修改时间 | 支持时间查询 |
| completed | 否 | datetime | 完成时间 | 支持时间查询 |
| limit | 否 | integer | 每页数量（默认30，最大200） | |
| page | 否 | integer | 页码（从1开始） | |
| order | 否 | string | 排序规则 | 需urlencode |
| fields | 否 | string | 返回字段（逗号分隔） | |

### 更新任务

**URL**: `POST https://api.tapd.cn/tasks`

**请求参数**:

| 字段名 | 必选 | 类型 | 说明 |
|--------|------|------|------|
| id | 是 | integer | 任务ID |
| workspace_id | 是 | integer | 项目ID |
| name | 否 | string | 任务名称 |
| owner | 否 | string | 处理人 |
| status | 否 | string | 状态 |
| priority | 否 | string | 优先级 |
| begin | 否 | date | 预计开始 |
| due | 否 | date | 预计结束 |
| iteration_id | 否 | string | 迭代ID |
| description | 否 | string | 详细描述 |
| effort_completed | 否 | string | 完成工时 |
| remain | 否 | float | 剩余工时 |
| custom_field_* | 否 | string/integer | 自定义字段 |

### 批量更新任务

**URL**: `POST https://api.tapd.cn/tasks/batch_update_task`

**说明**: 支持一次更新多个任务的相同字段

## 任务字段说明

### 状态 (status)
- `open` - 打开
- `progressing` - 进行中
- `done` - 已完成
- `suspended` - 已暂停

### 优先级 (priority)
- 支持自定义优先级

## 相关文档

- [需求API](./14-需求API.md)
- [缺陷API](./15-缺陷API.md)
- [迭代API](./17-迭代API.md)
