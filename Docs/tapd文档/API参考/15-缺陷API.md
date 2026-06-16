# 缺陷 (Bug) API 参考

本文档包含TAPD缺陷相关的所有API接口。

## API列表

### 基础操作
- 创建缺陷: `POST /bugs`
- 获取缺陷: `GET /bugs`
- 更新缺陷: `POST /bugs`
- 批量更新缺陷: `POST /bugs/batch_update_bug`
- 获取缺陷数量: `GET /bugs/count`
- 复制缺陷: `POST /bugs/copy`

### 缺陷关联
- 获取缺陷与其它缺陷的所有关联关系: `GET /bugs/get_link_bugs`
- 关联缺陷: `POST /bugs/link_bugs`
- 取消关联缺陷: `POST /bugs/delete_link_bugs`
- 获取缺陷关联的需求ID: `GET /bugs/get_related_stories`

### 缺陷变更
- 获取缺陷变更历史: `GET /bugs/changes`
- 获取缺陷变更次数: `GET /bugs/changes/count`

### 缺陷配置
- 获取缺陷自定义字段配置: `GET /bugs/custom_fields_settings`
- 获取缺陷所有字段及候选值: `GET /bugs/fields_info`
- 获取缺陷所有字段的中英文: `GET /bugs/fields_label`
- 更新系统字段: `POST /bugs/update_system_select_field_options`

### 缺陷模板
- 获取缺陷模板列表: `GET /bugs/template_list`
- 获取缺陷模板字段: `GET /bugs/default_template`

### 缺陷视图
- 获取视图对应的缺陷列表: `GET /bugs/get_bugs_by_view_conf_id`
- 转换缺陷ID成列表queryToken: `POST /bugs/ids_to_query_token`
- 过滤条件转换成列表queryToken: `POST /bugs/filter_to_query_token`

### 缺陷回收站
- 获取回收站的缺陷: `GET /bugs/removed`

## 核心API详解

### 创建缺陷

**URL**: `POST https://api.tapd.cn/bugs`

**请求参数**:

| 字段名 | 必选 | 类型 | 说明 |
|--------|------|------|------|
| workspace_id | 是 | integer | 项目ID |
| title | 是 | string | 缺陷标题 |
| severity | 否 | string | 严重程度（fatal/serious/normal/slight/suggest） |
| priority | 否 | string | 优先级 |
| current_owner | 否 | string | 当前处理人 |
| reporter | 否 | string | 报告人 |
| module | 否 | string | 模块 |
| status | 否 | string | 状态 |
| description | 否 | string | 详细描述 |
| iteration_id | 否 | string | 迭代ID |
| cc | 否 | string | 抄送人 |
| begin | 否 | date | 预计开始 |
| due | 否 | date | 预计结束 |
| platform | 否 | string | 平台 |
| os | 否 | string | 操作系统 |
| version | 否 | string | 版本 |
| baseline | 否 | string | 基线 |
| source | 否 | string | 来源 |
| type | 否 | string | 类型 |
| custom_field_* | 否 | string/integer | 自定义字段 |

### 获取缺陷

**URL**: `GET https://api.tapd.cn/bugs`

**请求参数**:

| 字段名 | 必选 | 类型 | 说明 | 特殊规则 |
|--------|------|------|------|----------|
| workspace_id | 是 | integer | 项目ID | |
| id | 否 | integer | 缺陷ID | 支持多ID查询 |
| title | 否 | string | 标题 | 支持模糊匹配 |
| severity | 否 | string | 严重程度 | 支持枚举查询 |
| priority | 否 | string | 优先级 | 支持枚举查询 |
| status | 否 | string | 状态 | 支持枚举查询 |
| current_owner | 否 | string | 当前处理人 | 支持模糊匹配 |
| reporter | 否 | string | 报告人 | 支持模糊匹配 |
| creator | 否 | string | 创建人 | 支持多人员查询 |
| iteration_id | 否 | string | 迭代ID | 支持不等于或枚举 |
| module | 否 | string | 模块 | |
| created | 否 | datetime | 创建时间 | 支持时间查询 |
| modified | 否 | datetime | 最后修改时间 | 支持时间查询 |
| resolved | 否 | datetime | 解决时间 | 支持时间查询 |
| closed | 否 | datetime | 关闭时间 | 支持时间查询 |
| limit | 否 | integer | 每页数量（默认30，最大200） | |
| page | 否 | integer | 页码（从1开始） | |
| order | 否 | string | 排序规则 | 需urlencode |
| fields | 否 | string | 返回字段（逗号分隔） | |

### 更新缺陷

**URL**: `POST https://api.tapd.cn/bugs`

**请求参数**:

| 字段名 | 必选 | 类型 | 说明 |
|--------|------|------|------|
| id | 是 | integer | 缺陷ID |
| workspace_id | 是 | integer | 项目ID |
| title | 否 | string | 标题 |
| severity | 否 | string | 严重程度 |
| priority | 否 | string | 优先级 |
| status | 否 | string | 状态 |
| current_owner | 否 | string | 当前处理人 |
| description | 否 | string | 详细描述 |
| iteration_id | 否 | string | 迭代ID |
| module | 否 | string | 模块 |
| custom_field_* | 否 | string/integer | 自定义字段 |

## 缺陷字段说明

### 严重程度 (severity)
- `fatal` - 致命
- `serious` - 严重
- `normal` - 一般
- `slight` - 轻微
- `suggest` - 建议

### 状态 (status)
- `new` - 新建
- `in_progress` - 处理中
- `reopened` - 重新打开
- `rejected` - 已拒绝
- `resolved` - 已解决
- `closed` - 已关闭
- `verified` - 已验证

## 相关文档

- [需求API](./14-需求API.md)
- [任务API](./16-任务API.md)
- [迭代API](./17-迭代API.md)
