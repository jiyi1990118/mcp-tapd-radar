# 使用Webhook

应用开发者团队可以在开发者后台配置**事件订阅**，订阅tapd Webhook事件

## 配置步骤

### 1.配置事件订阅（开发者后台 -> 选择应用 -> 应用开发 -> 事件订阅)

![事件订阅](/document/img/Webhook事件/新增事件订阅.png)

配置参数如下：

**URL**： Webhook地址，输入后会自动检测URL的连通性。当触发事件满足条件后，会向对应的Webhook地址发送请求

**触发事件**：支持发布评审、缺陷、需求等多个对象的相应事件

**内容类型**：支持application/json和application/form

**网关Token（可选）**：网关Token的填写用于tapd与目标机器网络不通的时候，开发者配置的应用网关的Token

**secret（可选）**：验证密码，用于给接入方验证请求是否来自TAPD

### 2.点击版本管理与发布，申请应用发布

![应用发布](/document/img/Webhook事件/应用发布.png)

### 3.在项目内安装应用，安装成功后，当满足触发事件时，可向Webhook地址发送请求

![应用发布](/document/img/Webhook事件/应用安装.png)

## 推送数据格式

以触发事件为需求的创建为例，返回数据如下所示：

```json
{
	"event": "story::create",
	"event_from": "web",
	"referer": "https://xxx/tapd_fe/xxx/story/list?useScene=storyList&groupType=&conf_id=xxx",
	"workspace_id": "xxx",
	"current_user": "xxx",
	"id": "1167870009001000028",
	"secret": "",
	"app_id": "3906",
	"rio_token": "",
	"devproxy_host": "http:/xxx.com",
	"queue_id": "130662",
	"event_id": "42079",
	"created": "2024-03-26 16:33:05"
}
```

## 字段说明

推送数据的主要字段说明如下：

| 字段 | 说明 |
| --- | --- |
| event | 触发事件，如：story::update、story::status_change、bug::update、bug::status_change等 |
| event_from | 触发事件的来源，如：web、api、tpa-timer等 |
| workspace_id | 项目ID |
| event.workspace_id | 触发事件的项目ID |
| current_user | 触发事件的用户 |
| secret | 验证密码 |
| id | 触发事件的业务对象ID |
| queue_id | 触发事件的队列ID |
| event_id | 触发事件的事件ID |

---
文档来源: https://open.tapd.cn/document/api-doc/快速入门/开发应用/使用Webhook-云端.html
更新时间: 2024-03-26 19:57:30
