# 工作空间 (Workspace) API 参考

本文档包含TAPD工作空间相关的所有API接口。

## API列表

### 项目信息
- 获取项目信息: `GET /workspaces/id/{workspace_id}`
- 更新项目信息: `POST /workspaces/{workspace_id}`
- 获取子项目信息: `GET /workspaces/sub_workspaces`
- 获取公司项目列表: `GET /workspaces/projects`
- 获取用户参与的项目列表: `GET /workspaces/user_participant_projects`

### 项目成员
- 添加项目成员: `POST /workspaces/add_workspace_member`
- 获取指定项目成员: `GET /workspaces/users`
- 获取项目成员列表: `GET /workspaces/users`
- 获取用户组ID对照关系: `GET /workspaces/roles`

### 项目配置
- 获取项目自定义字段: `GET /workspaces/custom_field_settings`
- 获取项目文档: `GET /workspaces/documents`

### 工作日历
- 设置自定义工作日历: `POST /workspaces/set_custom_work_calendar`
- 设置启用工作日历: `POST /workspaces/enable_work_calendar`
- 获取自定义工作日历详情: `GET /workspaces/get_custom_work_calendar`
- 获取工作日历设置列表及启用选项: `GET /workspaces/get_work_calendar_settings`

### 工作项ID转换
- 通过工作项短ID换长ID: `GET /workspaces/get_workitems_long_id_by_short_ids`

## 核心API详解

### 获取项目信息

**URL**: `GET https://api.tapd.cn/workspaces/id/{workspace_id}`

**路径参数**:

| 参数名 | 必选 | 类型 | 说明 |
|--------|------|------|------|
| workspace_id | 是 | integer | 项目ID |

**返回结果**:

```json
{
  "status": 1,
  "data": {
    "Workspace": {
      "id": "10158231",
      "name": "示例项目",
      "creator": "admin",
      "created": "2020-01-01 00:00:00",
      "status": "open"
    }
  }
}
```

### 获取公司项目列表

**URL**: `GET https://api.tapd.cn/workspaces/projects`

**请求参数**:

| 字段名 | 必选 | 类型 | 说明 |
|--------|------|------|------|
| company_id | 否 | integer | 公司ID |
| limit | 否 | integer | 每页数量（默认30） |
| page | 否 | integer | 页码（从1开始） |

### 获取用户参与的项目列表

**URL**: `GET https://api.tapd.cn/workspaces/user_participant_projects`

**说明**: 获取当前认证用户参与的所有项目

### 添加项目成员

**URL**: `POST https://api.tapd.cn/workspaces/add_workspace_member`

**请求参数**:

| 字段名 | 必选 | 类型 | 说明 |
|--------|------|------|------|
| workspace_id | 是 | integer | 项目ID |
| user | 是 | string | 用户名 |
| role_id | 否 | integer | 用户组ID |

### 获取项目成员列表

**URL**: `GET https://api.tapd.cn/workspaces/users`

**请求参数**:

| 字段名 | 必选 | 类型 | 说明 |
|--------|------|------|------|
| workspace_id | 是 | integer | 项目ID |
| limit | 否 | integer | 每页数量 |
| page | 否 | integer | 页码 |

### 获取项目自定义字段

**URL**: `GET https://api.tapd.cn/workspaces/custom_field_settings`

**请求参数**:

| 字段名 | 必选 | 类型 | 说明 |
|--------|------|------|------|
| workspace_id | 是 | integer | 项目ID |
| entity_type | 是 | string | 实体类型（story/bug/task） |

### 更新项目信息

**URL**: `POST https://api.tapd.cn/workspaces/{workspace_id}`

**请求参数**:

| 字段名 | 必选 | 类型 | 说明 |
|--------|------|------|------|
| name | 否 | string | 项目名称 |
| description | 否 | string | 项目描述 |
| status | 否 | string | 项目状态 |

## 工作空间字段说明

### 状态 (status)
- `open` - 正常
- `hidden` - 已归档
- `closed` - 已关闭

### 用户角色 (role_id)
- 1 - 项目管理员
- 2 - 项目成员
- 3 - 受限成员（只读）

## 相关文档

- [用户API](./19-用户API.md)
- [API使用必读](../07-API使用必读.md)
