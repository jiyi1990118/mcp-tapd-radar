# TAPD API 文档索引

本目录包含从TAPD开放平台整理的完整API文档，用于TAPD MCP开发的技术参考。

## 文档结构

### 快速入门

- [00-行业应用开发指导.md](./00-行业应用开发指导.md) - TAPD应用开发概述和流程
- [01-创建应用.md](./01-创建应用.md) - 如何在TAPD开放平台创建应用
- [03-快速接入.md](./03-快速接入.md) - 快速接入TAPD开放平台的步骤

### API使用

- [02-使用API.md](./02-使用API.md) - API使用流程和OAuth认证
- [04-授权凭证-项目态.md](./04-授权凭证-项目态.md) - 使用client_credentials模式获取access_token
- [07-API使用必读.md](./07-API使用必读.md) - API请求格式、参数说明、查询语法详解

### 权限与安全

- [05-应用权限控制.md](./05-应用权限控制.md) - 配置和使用应用权限
- [09-安全IP控制.md](./09-安全IP控制.md) - 配置安全IP来控制API访问

### Webhook与事件

- [06-使用Webhook.md](./06-使用Webhook.md) - 配置事件订阅和Webhook推送

### 扩展模块

- [08-接入扩展模块.md](./08-接入扩展模块.md) - 各类扩展模块的配置说明
- [13-扩展模块详解.md](./13-扩展模块详解.md) - 扩展模块详细介绍和上下文参数

### 应用发布

- [10-发布应用.md](./10-发布应用.md) - 应用发布流程

### 核心概念

- [11-核心概念概览.md](./11-核心概念概览.md) - TAPD核心概念总览
- [12-业务对象.md](./12-业务对象.md) - TAPD业务对象说明（需求、缺陷、任务）

## API参考文档

完整的API接口文档已补充，详见：
- **[API参考索引](./API参考/README.md)** - 100+ API接口完整文档

### 核心业务对象 API
- [需求 (Story) API](./API参考/14-需求API.md) - 40+ 接口
- [缺陷 (Bug) API](./API参考/15-缺陷API.md) - 20+ 接口
- [任务 (Task) API](./API参考/16-任务API.md) - 11 接口
- [迭代 (Iteration) API](./API参考/17-迭代API.md) - 14 接口

### 辅助功能 API
- [评论 (Comment) API](./API参考/18-评论API.md)
- [用户 (User) API](./API参考/19-用户API.md)
- [工作空间 (Workspace) API](./API参考/20-工作空间API.md)
- [Webhook API](./API参考/21-Webhook%20API.md)
- [附件 (Attachment) API](./API参考/22-附件API.md)
- [标签 (Label) API](./API参考/23-标签API.md)

## 关键信息摘要

### API基础信息

- **API地址**: `https://api.tapd.cn`
- **认证方式**: OAuth 2.0 (client_credentials模式)
- **Token获取**: `POST https://api.tapd.cn/tokens/request_token`
- **请求头认证**: `Authorization: Bearer ACCESS_TOKEN`

### 核心业务对象

TAPD支持以下核心业务对象：
- 需求 (Story) - [API文档](./API参考/14-需求API.md)
- 缺陷 (Bug) - [API文档](./API参考/15-缺陷API.md)
- 任务 (Task) - [API文档](./API参考/16-任务API.md)
- 迭代 (Iteration) - [API文档](./API参考/17-迭代API.md)

### 扩展模块类型

- **系统级**: 工作台-我的仪表盘
- **项目级**: 项目导航、应用设置、流水线设置
- **业务对象级**: 头部更多、Tab栏、字段信息、附件、编辑器toolbar等

### Webhook事件

支持订阅以下事件：
- `story::create` / `story::update` / `story::status_change`
- `bug::create` / `bug::update` / `bug::status_change`
- `task::create` / `task::update` / `task::status_change`

## 开发规范

**开发MCP工具时，必须以此处API文档为优先参考。**

### API文档优先原则

1. **实现前查阅**: 新增或修改MCP工具前，先查阅对应API文档
2. **参数对齐**: 确保MCP工具参数与API文档一致
3. **端点验证**: 实现后用curl测试API端点，确认实际行为
4. **文档同步**: 工具变更后同步更新所有文档

### 已验证的特殊情况

| 情况 | 说明 | 处理方式 |
|------|------|----------|
| 批量更新 | 需JSON Body格式，`workitems: [{id, ...}]` | 参考[14-需求API.md#批量更新需求](./API参考/14-需求API.md#批量更新需求) |
| 标签管理 | `/labels`端点不存在 | 通过`label`字段在业务对象上管理 |
| 迭代锁定 | 需要特殊应用权限 | 403错误表示权限不足 |

### 实现流程

```
1. 查阅API文档 → 2. 用curl测试端点 → 3. 实现MCP工具 → 4. 测试验证 → 5. 更新文档
```

## 文档来源

所有文档均来自TAPD开放平台官方文档: https://open.tapd.cn/document/api-doc/

最后更新: 2026-06-16
