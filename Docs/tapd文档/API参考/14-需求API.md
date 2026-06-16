# 需求 (Story) API 参考

本文档包含TAPD需求相关的所有API接口。

## 目录

### 基础操作
- [创建需求](#创建需求)
- [获取需求](#获取需求)
- [更新需求](#更新需求)
- [批量更新需求](#批量更新需求)
- [获取需求数量](#获取需求数量)
- [复制需求](#复制需求)

### 需求分类
- [创建需求分类](#创建需求分类)
- [获取需求分类](#获取需求分类)
- [获取需求分类数量](#获取需求分类数量)
- [获取指定分类需求数量](#获取指定分类需求数量)
- [更新需求分类](#更新需求分类)

### 需求关联
- [获取需求与其它需求的所有关联关系](#获取需求与其它需求的所有关联关系)
- [创建需求关联关系](#创建需求关联关系)
- [获取需求与测试用例关联关系](#获取需求与测试用例关联关系)
- [创建需求与测试用例关联关系](#创建需求与测试用例关联关系)
- [获取需求关联的缺陷](#获取需求关联的缺陷)
- [创建需求与缺陷关联关系](#创建需求与缺陷关联关系)
- [解除需求缺陷关联关系](#解除需求缺陷关联关系)

### 需求变更
- [获取需求变更历史](#获取需求变更历史)
- [获取需求变更次数](#获取需求变更次数)

### 需求配置
- [获取需求自定义字段配置](#获取需求自定义字段配置)
- [获取需求所有字段及候选值](#获取需求所有字段及候选值)
- [获取需求所有字段的中英文](#获取需求所有字段的中英文)
- [获取需求类别](#获取需求类别)
- [更新需求的需求类别](#更新需求的需求类别)

### 需求模板
- [获取需求模板列表](#获取需求模板列表)
- [获取需求模板字段](#获取需求模板字段)

### 需求关系
- [更新父需求](#更新父需求)
- [获取需求前后置关系](#获取需求前后置关系)
- [批量新增或修改需求前后置关系](#批量新增或修改需求前后置关系)
- [批量删除需求前后置关系](#批量删除需求前后置关系)

### 需求保密
- [获取需求保密信息](#获取需求保密信息)
- [批量修改保密信息](#批量修改保密信息)

### 需求视图
- [获取视图对应的需求列表](#获取视图对应的需求列表)
- [转换需求ID成列表queryToken](#转换需求ID成列表queryToken)
- [过滤条件转换成列表queryToken](#过滤条件转换成列表queryToken)

### 需求回收站
- [获取回收站的需求](#获取回收站的需求)

### 并行工作流
- [获取需求节点信息](#获取需求节点信息)

---

## 创建需求

创建新需求，返回新建需求的数据。

**URL**: `POST https://api.tapd.cn/stories`

**请求参数**:

| 字段名 | 必选 | 类型 | 说明 |
|--------|------|------|------|
| workspace_id | 是 | integer | 项目ID |
| name | 是 | string | 标题 |
| priority_label | 否 | string | 优先级（推荐使用） |
| business_value | 否 | integer | 业务价值 |
| version | 否 | string | 版本 |
| module | 否 | string | 模块 |
| test_focus | 否 | string | 测试重点 |
| size | 否 | integer | 规模 |
| owner | 否 | string | 处理人 |
| cc | 否 | string | 抄送人 |
| creator | 否 | string | 创建人 |
| developer | 否 | string | 开发人员 |
| begin | 否 | date | 预计开始 |
| due | 否 | date | 预计结束 |
| iteration_id | 否 | string | 迭代ID |
| templated_id | 否 | integer | 模板ID |
| parent_id | 否 | integer | 父需求ID |
| effort | 否 | string | 预估工时 |
| effort_completed | 否 | string | 完成工时 |
| remain | 否 | float | 剩余工时 |
| exceed | 否 | float | 超出工时 |
| category_id | 否 | integer | 需求分类 |
| workitem_type_id | 否 | integer | 需求类别 |
| release_id | 否 | integer | 发布计划 |
| source | 否 | string | 来源 |
| type | 否 | string | 类型 |
| feature | 否 | string | 特性 |
| tech_risk | 否 | string | 技术风险 |
| description | 否 | string | 详细描述 |
| label | 否 | string | 标签（多个以\|分隔） |
| custom_field_* | 否 | string/integer | 自定义字段 |
| custom_plan_field_* | 否 | string/integer | 自定义计划应用 |
| is_apply_template_default_value | 否 | integer | 是否继承模板默认值（1=继承） |
| apply_template | 否 | string | 模版选项（preset_stories,preset_tasks） |

**示例**:

```bash
curl -u 'api_user:api_password' \
  -d 'name=新需求&workspace_id=10158231' \
  'https://api.tapd.cn/stories'
```

**返回结果**:

```json
{
  "status": 1,
  "data": {
    "Story": {
      "id": "1010104801124922063",
      "name": "新需求",
      "workspace_id": "10104801",
      "status": "planning",
      "creator": "v_xuanfang",
      "created": "2025-06-16 14:42:59",
      "modified": "2025-06-16 14:42:59"
    }
  },
  "info": "success"
}
```

---

## 获取需求

批量查询符合条件的需求（分页，默认30条/页）。

**URL**: `GET https://api.tapd.cn/stories`

**请求参数**:

| 字段名 | 必选 | 类型 | 说明 | 特殊规则 |
|--------|------|------|------|----------|
| workspace_id | 是 | integer | 项目ID | |
| id | 否 | integer | 需求ID | 支持多ID查询 |
| name | 否 | string | 标题 | 支持模糊匹配 |
| priority_label | 否 | string | 优先级 | |
| status | 否 | string | 状态 | 支持枚举查询 |
| v_status | 否 | string | 状态（中文名称） | |
| with_v_status | 否 | string | 返回中文状态（1） | |
| label | 否 | string | 标签 | 支持枚举查询 |
| workitem_type_id | 否 | string | 需求类别ID | 支持枚举查询 |
| owner | 否 | string | 处理人 | 支持模糊匹配 |
| creator | 否 | string | 创建人 | 支持多人员查询 |
| developer | 否 | string | 开发人员 | |
| iteration_id | 否 | string | 迭代ID | 支持不等于或枚举 |
| include_sub_iteration | 否 | string | 包含子迭代（0/1） | |
| category_id | 否 | integer | 需求分类 | 支持枚举查询 |
| include_sub_category | 否 | string | 包含子分类（0/1） | |
| parent_id | 否 | integer | 父需求ID | |
| ancestor_id | 否 | integer | 祖先需求ID | 查询所有子需求 |
| include_leaf_stories | 否 | string | 包含子需求（0/1） | |
| created | 否 | datetime | 创建时间 | 支持时间查询 |
| modified | 否 | datetime | 最后修改时间 | 支持时间查询 |
| completed | 否 | datetime | 完成时间 | 支持时间查询 |
| begin | 否 | date | 预计开始 | 支持时间查询 |
| due | 否 | date | 预计结束 | 支持时间查询 |
| description | 否 | string | 详细描述 | 支持模糊匹配 |
| custom_field_* | 否 | string/integer | 自定义字段 | 支持枚举查询 |
| limit | 否 | integer | 每页数量（默认30，最大200） | |
| page | 否 | integer | 页码（从1开始） | |
| order | 否 | string | 排序规则（需urlencode） | 如：created%20desc |
| fields | 否 | string | 返回字段（逗号分隔） | |

**时间查询规则**:
- `>2026-01-01` - 大于指定日期
- `<2026-12-31` - 小于指定日期
- `2026-01-01~2026-12-31` - 时间范围

**示例**:

```bash
# 获取项目下所有需求
curl -u 'api_user:api_password' \
  'https://api.tapd.cn/stories?workspace_id=10158231'

# 获取指定需求的部分字段
curl -u 'api_user:api_password' \
  'https://api.tapd.cn/stories?workspace_id=10104801&id=1010104801869398419&fields=id,name,status,owner'
```

**返回结果**:

```json
{
  "status": 1,
  "data": [
    {
      "Story": {
        "id": "1010104801869398419",
        "name": "需求标题",
        "status": "planning",
        "owner": "username"
      }
    }
  ],
  "info": "success"
}
```

---

## 更新需求

更新需求，返回更新后的数据。

**URL**: `POST https://api.tapd.cn/stories`

**请求参数**:

| 字段名 | 必选 | 类型 | 说明 |
|--------|------|------|------|
| id | 是 | integer | 需求ID |
| workspace_id | 是 | integer | 项目ID |
| name | 否 | string | 标题 |
| priority_label | 否 | string | 优先级 |
| business_value | 否 | integer | 业务价值 |
| status | 否 | string | 状态 |
| v_status | 否 | string | 状态（中文） |
| version | 否 | string | 版本 |
| module | 否 | string | 模块 |
| test_focus | 否 | string | 测试重点 |
| size | 否 | integer | 规模 |
| owner | 否 | string | 处理人 |
| current_user | 否 | string | 变更人 |
| cc | 否 | string | 抄送人 |
| developer | 否 | string | 开发人员 |
| begin | 否 | date | 预计开始 |
| due | 否 | date | 预计结束 |
| iteration_id | 否 | string | 迭代ID |
| effort | 否 | string | 预估工时 |
| effort_completed | 否 | string | 完成工时 |
| remain | 否 | float | 剩余工时 |
| exceed | 否 | float | 超出工时 |
| category_id | 否 | integer | 需求分类 |
| release_id | 否 | integer | 发布计划 |
| source | 否 | string | 来源 |
| type | 否 | string | 类型 |
| description | 否 | string | 详细描述 |
| is_auto_close_task | 否 | integer | 自动关闭任务（1=是） |
| label | 否 | string | 标签 |
| custom_field_* | 否 | string/integer | 自定义字段 |

**注意**: 
- 并行工作流需求更新状态时，将按状态重置来更新节点
- 进行中节点变更参考节点完成接口

**示例**:

```bash
curl -u 'api_user:api_password' \
  -d 'id=1010104801125341253&priority_label=高&owner=anyechen&workspace_id=10104801' \
  'https://api.tapd.cn/stories'
```

**返回结果**:

```json
{
  "status": 1,
  "data": {
    "Story": {
      "id": "1010104801125341253",
      "name": "需求标题",
      "priority_label": "高",
      "owner": "anyechen",
      "modified": "2025-07-08 14:51:25"
    }
  },
  "info": "success"
}
```

---

## 需求字段说明

### 状态字段 (status)
- `planning` - 规划中
- `developing` - 开发中
- `testing` - 测试中
- `done` - 已完成

### 优先级 (priority_label)
- 推荐使用 `priority_label` 而非 `priority`
- 支持自定义优先级

### 自定义字段
- `custom_field_1` ~ `custom_field_200` - 自定义字段
- `custom_plan_field_1` ~ `custom_plan_field_10` - 自定义计划应用字段

### 查询语法
- **模糊匹配**: `LIKE<关键词>`
- **枚举查询**: `value1|value2` 或 `EQ<value>`
- **不等于**: `NOT_EQ<value>` 或 `<>value`
- **时间范围**: `>date`, `<date`, `date~date`
- **多人员**: `USER_OR<user1|user2>`

---

## API速率限制

- 默认每分钟600次请求
- 单次查询最多返回200条记录
- 建议使用分页查询大量数据

## 错误码

| 状态码 | 说明 |
|--------|------|
| 1 | 成功 |
| 403 | 无权限访问项目 |
| 400 | 参数错误 |
| 401 | 认证失败 |

## 相关文档

- [缺陷API](./15-缺陷API.md)
- [任务API](./16-任务API.md)
- [迭代API](./17-迭代API.md)
- [API使用必读](../07-API使用必读.md)
