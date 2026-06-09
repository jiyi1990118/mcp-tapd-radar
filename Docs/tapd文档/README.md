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

## 关键信息摘要

### API基础信息

- **API地址**: `https://api.tapd.cn`
- **认证方式**: OAuth 2.0 (client_credentials模式)
- **Token获取**: `POST https://api.tapd.cn/tokens/request_token`
- **请求头认证**: `Authorization: Bearer ACCESS_TOKEN`

### 核心业务对象

TAPD支持以下核心业务对象：
- 需求 (Story)
- 缺陷 (Bug)  
- 任务 (Task)
- 迭代 (Iteration)

### 扩展模块类型

- **系统级**: 工作台-我的仪表盘
- **项目级**: 项目导航、应用设置、流水线设置
- **业务对象级**: 头部更多、Tab栏、字段信息、附件、编辑器toolbar等

### Webhook事件

支持订阅以下事件：
- `story::create` / `story::update` / `story::status_change`
- `bug::create` / `bug::update` / `bug::status_change`
- `task::create` / `task::update` / `task::status_change`

## 文档来源

所有文档均来自TAPD开放平台官方文档: https://open.tapd.cn/document/api-doc/

最后更新: 2026-06-09
