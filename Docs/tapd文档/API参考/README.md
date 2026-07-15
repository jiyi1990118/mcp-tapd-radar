# TAPD API 参考索引

完整的TAPD开放平台API接口文档。

## 📚 文档导航

### 核心业务对象 API

| API分类 | 文档 | 主要功能 |
|---------|------|----------|
| **需求 (Story)** | [14-需求API.md](./14-需求API.md) | 创建、查询、更新需求，需求分类，需求关联 |
| **缺陷 (Bug)** | [15-缺陷API.md](./15-缺陷API.md) | 创建、查询、更新缺陷，缺陷关联 |
| **任务 (Task)** | [16-任务API.md](./16-任务API.md) | 创建、查询、更新任务 |
| **迭代 (Iteration)** | [17-迭代API.md](./17-迭代API.md) | 创建、查询、更新迭代，迭代锁定 |

### 辅助功能 API

| API分类 | 文档 | 主要功能 |
|---------|------|----------|
| **评论 (Comment)** | [18-评论API.md](./18-评论API.md) | 添加、查询评论 |
| **用户 (User)** | [19-用户API.md](./19-用户API.md) | 获取项目成员 |
| **工作空间 (Workspace)** | [20-工作空间API.md](./20-工作空间API.md) | 项目信息、成员管理 |
| **Webhook** | [21-Webhook API.md](./21-Webhook%20API.md) | 事件订阅、Webhook管理 |
| **附件 (Attachment)** | [22-附件API.md](./22-附件API.md) | 获取附件下载链接 |
| **标签 (Label)** | [23-标签API.md](./23-标签API.md) | 创建、管理标签 |

## 🚀 快速开始

### API基础信息

- **API地址**: `https://api.tapd.cn`
- **认证方式**: OAuth 2.0 (client_credentials)
- **请求格式**: JSON/XML (默认JSON)
- **速率限制**: 600次/分钟

### 认证流程

1. 获取access_token:
```bash
curl -X POST https://api.tapd.cn/tokens/request_token \
  -d 'grant_type=client_credentials&client_id=YOUR_CLIENT_ID&client_secret=YOUR_CLIENT_SECRET'
```

2. 使用token调用API:
```bash
curl -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
  https://api.tapd.cn/stories?workspace_id=10158231
```

### 常用查询语法

| 语法 | 示例 | 说明 |
|------|------|------|
| 模糊匹配 | `name=LIKE<关键词>` | 标题包含关键词 |
| 枚举查询 | `status=new\|in_progress` | 状态为new或in_progress |
| 不等于 | `iteration_id=<>123` | 不在迭代123中 |
| 时间范围 | `created=2026-01-01~2026-12-31` | 创建时间范围 |
| 大于/小于 | `created=>2026-01-01` | 2026年1月1日后创建 |

## 📖 相关文档

### 开发指南
- [00-行业应用开发指导](../00-行业应用开发指导.md)
- [02-使用API](../02-使用API.md)
- [03-快速接入](../03-快速接入.md)
- [04-授权凭证-项目态](../04-授权凭证-项目态.md)
- [07-API使用必读](../07-API使用必读.md)

### 核心概念
- [11-核心概念概览](../11-核心概念概览.md)
- [12-业务对象](../12-业务对象.md)

### Webhook与事件
- [06-使用Webhook](../06-使用Webhook.md)

## 🔧 MCP工具映射

本项目的MCP工具与API的对应关系：

| MCP工具 | 对应API | 文档 |
|---------|---------|------|
| `tapd_list_stories` | `GET /stories` | [14-需求API.md](./14-需求API.md#获取需求) |
| `tapd_get_story` | `GET /stories?id={id}` | [14-需求API.md](./14-需求API.md#获取需求) |
| `tapd_create_story` | `POST /stories` | [14-需求API.md](./14-需求API.md#创建需求) |
| `tapd_update_story` | `POST /stories` | [14-需求API.md](./14-需求API.md#更新需求) |
| `tapd_batch_update_stories` | `POST /stories/batch_update_story` | [14-需求API.md](./14-需求API.md#批量更新需求) |
| `tapd_list_bugs` | `GET /bugs` | [15-缺陷API.md](./15-缺陷API.md#获取缺陷) |
| `tapd_create_bug` | `POST /bugs` | [15-缺陷API.md](./15-缺陷API.md#创建缺陷) |
| `tapd_update_bug` | `POST /bugs` | [15-缺陷API.md](./15-缺陷API.md#更新缺陷) |
| `tapd_batch_update_bugs` | `POST /bugs/batch_update_bug` | [15-缺陷API.md](./15-缺陷API.md#批量更新缺陷) |
| `tapd_list_tasks` | `GET /tasks` | [16-任务API.md](./16-任务API.md#获取任务) |
| `tapd_create_task` | `POST /tasks` | [16-任务API.md](./16-任务API.md#创建任务) |
| `tapd_update_task` | `POST /tasks` | [16-任务API.md](./16-任务API.md#更新任务) |
| `tapd_batch_update_tasks` | `POST /tasks/batch_update_task` | [16-任务API.md](./16-任务API.md#批量更新任务) |
| `tapd_list_iterations` | `GET /iterations` | [17-迭代API.md](./17-迭代API.md#获取迭代) |
| `tapd_set_iteration_lock` | `POST /iterations/lock` \| `POST /iterations/unlock` | [17-迭代API.md](./17-迭代API.md#锁定迭代) |
| `tapd_create_comment` | `POST /comments` | [18-评论API.md](./18-评论API.md#添加评论) |
| `tapd_list_users` | `GET /workspaces/users` | [19-用户API.md](./19-用户API.md#获取项目成员列表) |
| `tapd_list_workspaces` | `GET /workspaces/projects` | [20-工作空间API.md](./20-工作空间API.md#获取公司项目列表) |

> **注意**: 迭代锁定/解锁需要特殊应用权限。标签通过业务对象的 `label` 字段管理，无独立API。Webhook 工具仅操作本地存储，TAPD Open API 不提供 Webhook 管理端点。

## 📊 API统计

- **需求API**: 40+ 接口
- **缺陷API**: 20+ 接口
- **任务API**: 11 接口
- **迭代API**: 14 接口
- **其他API**: 15+ 接口

**总计**: 100+ API接口

## 🌟 最佳实践

### 1. 分页查询
```bash
# 避免一次性获取大量数据
curl 'https://api.tapd.cn/stories?workspace_id=123&limit=200&page=1'
```

### 2. 字段过滤
```bash
# 只返回需要的字段
curl 'https://api.tapd.cn/stories?workspace_id=123&fields=id,name,status'
```

### 3. 批量操作（JSON Body格式）
```bash
# 批量更新接口必须使用JSON Body格式
curl -X POST 'https://api.tapd.cn/stories/batch_update_story' \
  -H 'Content-Type: application/json' \
  -d '{
    "workspace_id": "123",
    "workitems": [
      {"id": "1", "status": "done"},
      {"id": "2", "status": "done"}
    ]
  }'
```

### 4. 错误处理
```javascript
if (response.status !== 1) {
  console.error('API错误:', response.info);
}
```

## 📝 更新日志

- 2026-06-15: 创建完整API参考文档
- 包含需求、缺陷、任务、迭代、评论、用户、工作空间、Webhook、附件、标签等所有API

## 🔗 相关链接

- [TAPD开放平台](https://open.tapd.cn/)
- [MCP TAPD Radar](https://github.com/jiyi1990118/mcp-tapd-radar)
- [TAPD官方文档](https://open.tapd.cn/document/api-doc/)
