# 迭代 (Iteration) API 参考

本文档包含TAPD迭代相关的所有API接口。

## API列表

### 基础操作
- 创建迭代: `POST /iterations`
- 获取迭代: `GET /iterations`
- 更新迭代: `POST /iterations`
- 获取迭代数量: `GET /iterations/count`

### 迭代锁定
- 锁定迭代: `POST /iterations/lock`
- 解锁迭代: `POST /iterations/unlock`

### 迭代变更
- 获取迭代变更历史: `GET /iterations/changes`

### 迭代配置
- 获取迭代自定义字段配置: `GET /iterations/custom_fields_settings`
- 获取迭代类别列表: `GET /iterations/workitem_types`

### 迭代模板
- 获取迭代模板列表: `GET /iterations/template_list`
- 获取迭代模板字段配置: `GET /iterations/template_fields`
- 获取迭代类别默认模板字段配置: `GET /iterations/default_template_fields_by_workitem_type_id`

### 迭代自定义卡片
- 获取迭代自定义卡片内容: `GET /iterations/custom_dash_board_content`
- 更新迭代自定义卡片内容: `POST /iterations/custom_dash_board_content`

## 核心API详解

### 创建迭代

**URL**: `POST https://api.tapd.cn/iterations`

**请求参数**:

| 字段名 | 必选 | 类型 | 说明 |
|--------|------|------|------|
| workspace_id | 是 | integer | 项目ID |
| name | 是 | string | 迭代名称 |
| startdate | 否 | date | 开始日期 |
| enddate | 否 | date | 结束日期 |
| status | 否 | string | 状态（open/done） |
| description | 否 | string | 详细描述 |
| creator | 否 | string | 创建人 |
| custom_field_* | 否 | string/integer | 自定义字段 |

### 获取迭代

**URL**: `GET https://api.tapd.cn/iterations`

**请求参数**:

| 字段名 | 必选 | 类型 | 说明 | 特殊规则 |
|--------|------|------|------|----------|
| workspace_id | 是 | integer | 项目ID | |
| id | 否 | integer | 迭代ID | 支持多ID查询 |
| name | 否 | string | 迭代名称 | 支持模糊匹配 |
| status | 否 | string | 状态 | 支持枚举查询 |
| creator | 否 | string | 创建人 | |
| startdate | 否 | date | 开始日期 | 支持时间查询 |
| enddate | 否 | date | 结束日期 | 支持时间查询 |
| created | 否 | datetime | 创建时间 | 支持时间查询 |
| modified | 否 | datetime | 最后修改时间 | 支持时间查询 |
| limit | 否 | integer | 每页数量（默认30，最大200） | |
| page | 否 | integer | 页码（从1开始） | |
| order | 否 | string | 排序规则 | 需urlencode |
| fields | 否 | string | 返回字段（逗号分隔） | |

### 更新迭代

**URL**: `POST https://api.tapd.cn/iterations`

**请求参数**:

| 字段名 | 必选 | 类型 | 说明 |
|--------|------|------|------|
| id | 是 | integer | 迭代ID |
| workspace_id | 是 | integer | 项目ID |
| name | 否 | string | 迭代名称 |
| startdate | 否 | date | 开始日期 |
| enddate | 否 | date | 结束日期 |
| status | 否 | string | 状态 |
| description | 否 | string | 详细描述 |
| custom_field_* | 否 | string/integer | 自定义字段 |

### 锁定迭代

**URL**: `POST https://api.tapd.cn/iterations/lock`

**请求参数**:

| 字段名 | 必选 | 类型 | 说明 |
|--------|------|------|------|
| id | 是 | integer | 迭代ID |
| workspace_id | 是 | integer | 项目ID |

**说明**: 锁定后迭代内的需求、缺陷、任务将不可编辑

### 解锁迭代

**URL**: `POST https://api.tapd.cn/iterations/unlock`

**请求参数**:

| 字段名 | 必选 | 类型 | 说明 |
|--------|------|------|------|
| id | 是 | integer | 迭代ID |
| workspace_id | 是 | integer | 项目ID |

## 迭代字段说明

### 状态 (status)
- `open` - 进行中
- `done` - 已完成

### 迭代类型
- Sprint - 冲刺迭代
- Release - 发布计划

## 相关文档

- [需求API](./14-需求API.md)
- [缺陷API](./15-缺陷API.md)
- [任务API](./16-任务API.md)
