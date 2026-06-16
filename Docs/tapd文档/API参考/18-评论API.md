# 评论 (Comment) API 参考

本文档包含TAPD评论相关的所有API接口。

## API列表

- 添加评论: `POST /comments`
- 获取评论: `GET /comments`
- 获取评论数量: `GET /comments/count`
- 更新评论: `POST /comments/update`

## 核心API详解

### 添加评论

**URL**: `POST https://api.tapd.cn/comments`

**请求参数**:

| 字段名 | 必选 | 类型 | 说明 |
|--------|------|------|------|
| workspace_id | 是 | integer | 项目ID |
| entry_type | 是 | string | 实体类型（story/bug/task） |
| entry_id | 是 | integer | 实体ID |
| description | 是 | string | 评论内容 |
| author | 否 | string | 评论作者 |

**示例**:

```bash
curl -u 'api_user:api_password' \
  -d 'workspace_id=10158231&entry_type=story&entry_id=1234567890&description=这是一条评论' \
  'https://api.tapd.cn/comments'
```

### 获取评论

**URL**: `GET https://api.tapd.cn/comments`

**请求参数**:

| 字段名 | 必选 | 类型 | 说明 |
|--------|------|------|------|
| workspace_id | 是 | integer | 项目ID |
| entry_type | 是 | string | 实体类型（story/bug/task） |
| entry_id | 是 | integer | 实体ID |
| limit | 否 | integer | 每页数量（默认30，最大200） |
| page | 否 | integer | 页码（从1开始） |

### 获取评论数量

**URL**: `GET https://api.tapd.cn/comments/count`

**请求参数**:

| 字段名 | 必选 | 类型 | 说明 |
|--------|------|------|------|
| workspace_id | 是 | integer | 项目ID |
| entry_type | 是 | string | 实体类型 |
| entry_id | 是 | integer | 实体ID |

### 更新评论

**URL**: `POST https://api.tapd.cn/comments/update`

**请求参数**:

| 字段名 | 必选 | 类型 | 说明 |
|--------|------|------|------|
| id | 是 | integer | 评论ID |
| workspace_id | 是 | integer | 项目ID |
| description | 是 | string | 新的评论内容 |

## 支持的实体类型

- `story` - 需求
- `bug` - 缺陷
- `task` - 任务

## 相关文档

- [需求API](./14-需求API.md)
- [缺陷API](./15-缺陷API.md)
- [任务API](./16-任务API.md)
