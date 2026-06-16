# 用户 (User) API 参考

本文档包含TAPD用户相关的API接口。

## API列表

- 获取项目成员列表: `GET /workspaces/users`
- 获取指定项目成员: `GET /workspaces/users`
- 获取用户组ID对照关系: `GET /workspaces/roles`

## 核心API详解

### 获取项目成员列表

**URL**: `GET https://api.tapd.cn/workspaces/users`

**请求参数**:

| 字段名 | 必选 | 类型 | 说明 |
|--------|------|------|------|
| workspace_id | 是 | integer | 项目ID |
| limit | 否 | integer | 每页数量（默认30，最大200） |
| page | 否 | integer | 页码（从1开始） |

**返回结果**:

```json
{
  "status": 1,
  "data": [
    {
      "User": {
        "user": "username",
        "name": "用户昵称",
        "role_id": "1",
        "email": "user@example.com"
      }
    }
  ]
}
```

### 获取用户组ID对照关系

**URL**: `GET https://api.tapd.cn/workspaces/roles`

**请求参数**:

| 字段名 | 必选 | 类型 | 说明 |
|--------|------|------|------|
| workspace_id | 是 | integer | 项目ID |

**返回结果**:

```json
{
  "status": 1,
  "data": [
    {
      "Role": {
        "id": "1",
        "name": "项目管理员"
      }
    },
    {
      "Role": {
        "id": "2",
        "name": "项目成员"
      }
    }
  ]
}
```

## 用户字段说明

### 用户标识
- `user` - 用户账号（用于API调用）
- `name` - 用户昵称（显示名称）
- `email` - 用户邮箱

### 用户角色
- `1` - 项目管理员（完整权限）
- `2` - 项目成员（标准权限）
- `3` - 受限成员（只读权限）

## 用户名格式

在API中使用用户时，可以使用以下格式：

1. **单个用户**: `username`
2. **多个用户（或查询）**: `user1|user2`
3. **用户+分号**: `username;` （某些字段如owner需要）

## 相关文档

- [工作空间API](./20-工作空间API.md)
- [评论API](./18-评论API.md)
