# Webhook API 参考

本文档包含TAPD Webhook相关的API接口。

> ⚠️ **重要发现**: 经过实际测试，`/webhooks` 端点返回 "Hello world from TAPD API"，表明该端点可能不存在或未启用。
>
> **实际情况**: TAPD Webhook 配置需要通过 TAPD 网页界面完成，无法通过 Open API 管理。
> 网页配置地址: https://www.tapd.cn/help/view#1120003271001002318

## API列表（文档记录，未验证可用性）

> ⚠️ 以下API来自官方文档，但实际测试未通过：

- 创建Webhook: `POST /webhooks` — 返回 "Hello world from TAPD API"
- 获取Webhook列表: `GET /webhooks` — 返回 "Hello world from TAPD API"
- 删除Webhook: `DELETE /webhooks/{webhook_id}` — 返回 "Hello world from TAPD API"

## 通过TAPD网页配置Webhook

1. 登录 TAPD 项目
2. 进入 项目设置 → 应用设置 → Webhook
3. 添加Webhook URL和订阅事件

## 支持的事件类型

| 事件 | 说明 |
|------|------|
| story::create | 需求创建 |
| story::update | 需求更新 |
| story::status_change | 需求状态变更 |
| bug::create | 缺陷创建 |
| bug::update | 缺陷更新 |
| bug::status_change | 缺陷状态变更 |
| task::create | 任务创建 |
| task::update | 任务更新 |
| task::status_change | 任务状态变更 |

## Webhook负载格式

当事件触发时，TAPD会向配置的URL发送POST请求：

```json
{
  "event": "story::create",
  "workspace_id": "10158231",
  "timestamp": 1640000000,
  "data": {
    "Story": {
      "id": "1234567890",
      "name": "需求标题",
      "status": "planning",
      "creator": "username"
    }
  }
}
```

## 签名验证

如果配置了secret，TAPD会在请求头中添加签名：

```
X-Tapd-Signature: sha256={signature}
```

验证方法：
```javascript
const crypto = require('crypto');
const signature = crypto
  .createHmac('sha256', secret)
  .update(JSON.stringify(payload))
  .digest('hex');
```

## 相关文档

- [使用Webhook](../06-使用Webhook.md)
- [需求API](./14-需求API.md)
- [缺陷API](./15-缺陷API.md)
- [任务API](./16-任务API.md)
