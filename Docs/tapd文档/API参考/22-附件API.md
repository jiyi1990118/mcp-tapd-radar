# 附件 (Attachment) API 参考

本文档包含TAPD附件相关的API接口。

## API列表

- 获取附件: `GET /attachments`
- 获取单个附件下载链接: `GET /attachments/{attachment_id}`
- 获取单个图片下载链接: `GET /attachments/image/{image_id}`
- 获取单个文档下载链接: `GET /attachments/document/{document_id}`

## 核心API详解

### 获取附件

**URL**: `GET https://api.tapd.cn/attachments`

**请求参数**:

| 字段名 | 必选 | 类型 | 说明 |
|--------|------|------|------|
| workspace_id | 是 | integer | 项目ID |
| entry_type | 是 | string | 实体类型（story/bug/task） |
| entry_id | 是 | integer | 实体ID |
| limit | 否 | integer | 每页数量（默认30） |
| page | 否 | integer | 页码（从1开始） |

**返回结果**:

```json
{
  "status": 1,
  "data": [
    {
      "Attachment": {
        "id": "123456",
        "name": "文件名.png",
        "size": "102400",
        "created": "2025-01-01 12:00:00",
        "creator": "username",
        "url": "https://api.tapd.cn/..."
      }
    }
  ]
}
```

### 获取单个附件下载链接

**URL**: `GET https://api.tapd.cn/attachments/{attachment_id}`

**路径参数**:

| 参数名 | 必选 | 类型 | 说明 |
|--------|------|------|------|
| attachment_id | 是 | integer | 附件ID |

**请求参数**:

| 字段名 | 必选 | 类型 | 说明 |
|--------|------|------|------|
| workspace_id | 是 | integer | 项目ID |

**返回**: 重定向到附件下载链接

### 获取单个图片下载链接

**URL**: `GET https://api.tapd.cn/attachments/image/{image_id}`

**说明**: 用于获取描述中嵌入的图片

### 获取单个文档下载链接

**URL**: `GET https://api.tapd.cn/attachments/document/{document_id}`

**说明**: 用于下载项目文档

## 附件类型

- **图片**: png, jpg, jpeg, gif, bmp
- **文档**: doc, docx, xls, xlsx, ppt, pptx, pdf
- **其他**: zip, rar, txt, md

## 上传附件

附件上传通过创建/更新需求、缺陷、任务时的描述字段实现。

在描述中使用以下格式引用已上传的图片：

```html
<img src="https://www.tapd.cn/tfl/captures/..." />
```

## 相关文档

- [需求API](./14-需求API.md)
- [缺陷API](./15-缺陷API.md)
- [任务API](./16-任务API.md)
