# 标签 (Label) API 参考

本文档说明TAPD标签的管理方式。

> ⚠️ **重要发现**: 经过实际测试，`/labels` 独立API端点返回 "Hello world from TAPD API"，表明这些端点可能不存在或未启用。
>
> **推荐做法**: 通过需求/缺陷/任务的 `label` 字段直接管理标签，TAPD会自动创建不存在的标签。

## 标签管理方式

### 方式1：通过业务对象字段（推荐）

创建或更新需求/缺陷/任务时，使用 `label` 字段：

```bash
# 单个标签
curl -u 'api_user:api_password' \
  -d 'workspace_id=10158231&id=123456&label=紧急' \
  'https://api.tapd.cn/stories'

# 多个标签（使用|分隔）
curl -u 'api_user:api_password' \
  -d 'workspace_id=10158231&id=123456&label=紧急|高优先级|前端' \
  'https://api.tapd.cn/stories'
```

如果标签不存在，TAPD会自动创建。

### 方式2：独立API（文档记录，但未验证可用性）

> ⚠️ 以下API来自官方文档，但实际测试未通过，仅供参考：

- 创建标签: `POST /labels`
- 获取自定义标签: `GET /labels`
- 获取标签数量: `GET /labels/count`
- 更新标签: `POST /labels/update`

## 核心API详解

### 创建标签

**URL**: `POST https://api.tapd.cn/labels`

**请求参数**:

| 字段名 | 必选 | 类型 | 说明 |
|--------|------|------|------|
| workspace_id | 是 | integer | 项目ID |
| name | 是 | string | 标签名称 |
| color | 否 | string | 标签颜色（十六进制） |

**示例**:

```bash
curl -u 'api_user:api_password' \
  -d 'workspace_id=10158231&name=紧急&color=#FF0000' \
  'https://api.tapd.cn/labels'
```

### 获取自定义标签

**URL**: `GET https://api.tapd.cn/labels`

**请求参数**:

| 字段名 | 必选 | 类型 | 说明 |
|--------|------|------|------|
| workspace_id | 是 | integer | 项目ID |
| name | 否 | string | 标签名称（模糊匹配） |
| limit | 否 | integer | 每页数量（默认30） |
| page | 否 | integer | 页码（从1开始） |

**返回结果**:

```json
{
  "status": 1,
  "data": [
    {
      "Label": {
        "id": "123",
        "name": "紧急",
        "color": "#FF0000",
        "workspace_id": "10158231"
      }
    }
  ]
}
```

### 获取标签数量

**URL**: `GET https://api.tapd.cn/labels/count`

**请求参数**:

| 字段名 | 必选 | 类型 | 说明 |
|--------|------|------|------|
| workspace_id | 是 | integer | 项目ID |
| name | 否 | string | 标签名称 |

### 更新标签

**URL**: `POST https://api.tapd.cn/labels/update`

**请求参数**:

| 字段名 | 必选 | 类型 | 说明 |
|--------|------|------|------|
| id | 是 | integer | 标签ID |
| workspace_id | 是 | integer | 项目ID |
| name | 否 | string | 新的标签名称 |
| color | 否 | string | 新的标签颜色 |

## 在需求/缺陷/任务中使用标签

创建或更新实体时，使用`label`字段指定标签：

```bash
# 单个标签
label=紧急

# 多个标签（使用|分隔）
label=紧急|高优先级|前端
```

如果标签不存在，TAPD会自动创建。

## 标签颜色预设

常用颜色：
- 红色: `#FF0000`
- 橙色: `#FFA500`
- 黄色: `#FFFF00`
- 绿色: `#00FF00`
- 蓝色: `#0000FF`
- 紫色: `#800080`

## 相关文档

- [需求API](./14-需求API.md)
- [缺陷API](./15-缺陷API.md)
- [任务API](./16-任务API.md)
