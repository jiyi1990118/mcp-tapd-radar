# TAPD MCP 服务完整功能规划

## 一、服务架构概览

基于MCP (Model Context Protocol) 标准设计，提供三大核心能力：

1. **Tools** - 可执行的API操作工具
2. **Resources** - 只读数据资源访问
3. **Prompts** - 预定义工作流提示模板

## 二、认证与配置

### 2.1 环境变量配置

```
TAPD_CLIENT_ID=your_client_id
TAPD_CLIENT_SECRET=your_client_secret
TAPD_WORKSPACE_ID=default_workspace_id (可选)
TAPD_API_BASE_URL=https://api.tapd.cn (默认)
```

### 2.2 认证流程

- 使用 OAuth 2.0 client_credentials 模式
- Token有效期：7200秒
- 自动刷新机制：过期前自动重新获取
- Token缓存：内存缓存，避免频繁请求

### 2.3 认证实现

```typescript
interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  now: string;
}

class TapdAuthManager {
  private token: string | null;
  private expiresAt: number;
  
  async getToken(): Promise<string>;
  private async refreshToken(): Promise<void>;
}
```

## 三、Tools（工具）设计

### 3.1 需求 (Story) 管理工具

#### tapd_list_stories
列出需求列表，支持复杂查询和过滤

**参数**:
- `workspace_id` (必需): 项目ID
- `status`: 状态过滤 (new|in_progress|resolved等)
- `owner`: 处理人
- `creator`: 创建人
- `priority`: 优先级
- `iteration_id`: 迭代ID
- `created`: 创建时间范围 (支持 >2024-01-01, <2024-12-31, 2024-01~2024-06)
- `name`: 标题模糊搜索
- `limit`: 每页数量 (默认30, 最大200)
- `page`: 页码
- `fields`: 返回字段列表

**返回**: Story对象数组

#### tapd_get_story
获取单个需求详情

**参数**:
- `workspace_id` (必需): 项目ID
- `story_id` (必需): 需求ID
- `fields`: 返回字段列表

**返回**: Story对象详情

#### tapd_create_story
创建新需求

**参数**:
- `workspace_id` (必需): 项目ID
- `name` (必需): 需求标题
- `description`: 需求描述
- `priority`: 优先级
- `status`: 状态
- `owner`: 处理人
- `iteration_id`: 迭代ID
- `custom_fields`: 自定义字段对象

**返回**: 创建的Story对象

#### tapd_update_story
更新需求

**参数**:
- `workspace_id` (必需): 项目ID
- `story_id` (必需): 需求ID
- `name`: 需求标题
- `description`: 需求描述
- `status`: 状态
- `owner`: 处理人
- `priority`: 优先级
- 其他可更新字段

**返回**: 更新后的Story对象

### 3.2 缺陷 (Bug) 管理工具

#### tapd_list_bugs
列出缺陷列表

**参数**:
- `workspace_id` (必需): 项目ID
- `status`: 状态过滤
- `severity`: 严重程度
- `priority`: 优先级
- `current_owner`: 当前处理人
- `reporter`: 报告人
- `created`: 创建时间范围
- `title`: 标题模糊搜索
- `limit`: 每页数量
- `page`: 页码

**返回**: Bug对象数组

#### tapd_get_bug
获取缺陷详情

**参数**:
- `workspace_id` (必需)
- `bug_id` (必需)

#### tapd_create_bug
创建缺陷

**参数**:
- `workspace_id` (必需)
- `title` (必需)
- `description`: 缺陷描述
- `severity`: 严重程度
- `priority`: 优先级
- `current_owner`: 处理人

#### tapd_update_bug
更新缺陷

**参数**: 同create_bug，增加bug_id

### 3.3 任务 (Task) 管理工具

#### tapd_list_tasks
列出任务列表

**参数**:
- `workspace_id` (必需)
- `status`: 状态过滤
- `owner`: 处理人
- `creator`: 创建人
- `name`: 任务名称模糊搜索
- `limit`, `page`: 分页参数

#### tapd_create_task / tapd_update_task
创建和更新任务，参数类似Story和Bug

### 3.4 迭代 (Iteration) 管理工具

#### tapd_list_iterations
列出迭代列表

**参数**:
- `workspace_id` (必需)
- `status`: 状态 (open|done)

#### tapd_get_iteration
获取迭代详情及统计信息

**参数**:
- `workspace_id` (必需)
- `iteration_id` (必需)

### 3.5 Webhook 管理工具

#### tapd_list_webhooks
列出已配置的Webhook订阅

**参数**:
- `workspace_id` (必需)

#### tapd_create_webhook
创建Webhook事件订阅

**参数**:
- `workspace_id` (必需)
- `url` (必需): Webhook接收地址
- `events` (必需): 订阅事件列表 (如 story::create, bug::update)
- `secret`: 验证密钥

#### tapd_delete_webhook
删除Webhook订阅

**参数**:
- `workspace_id` (必需)
- `webhook_id` (必需)

## 四、Resources（资源）设计

### 4.1 workspace://workspaces
列出所有可访问的项目空间

**URI格式**: `workspace://workspaces`
**返回**: 项目列表及基本信息

### 4.2 workspace://workspace/{id}
获取特定项目空间详情

**URI格式**: `workspace://workspace/12345`
**返回**: 项目详细信息、成员、配置等

### 4.3 story://stories/{workspace_id}
获取项目的需求资源视图

**URI格式**: `story://stories/12345?status=in_progress`
**支持查询参数**: status, iteration_id, owner
**返回**: 需求列表快照

### 4.4 bug://bugs/{workspace_id}
获取项目的缺陷资源视图

**URI格式**: `bug://bugs/12345?severity=fatal`

### 4.5 iteration://iteration/{workspace_id}/{iteration_id}
获取迭代资源视图，包含关联的需求、缺陷、任务统计

## 五、Prompts（提示模板）设计

### 5.1 create_bug_from_description
从自然语言描述创建缺陷

**参数**:
- `description`: 问题描述
- `workspace_id`: 项目ID

**模板逻辑**:
1. 解析描述提取标题、严重程度、步骤
2. 自动填充缺陷字段
3. 调用 tapd_create_bug

### 5.2 sprint_planning
辅助迭代规划

**参数**:
- `workspace_id`: 项目ID
- `iteration_id`: 迭代ID
- `story_ids`: 待规划需求ID列表

**模板逻辑**:
1. 获取迭代信息
2. 分析需求优先级和依赖
3. 批量分配需求到迭代

### 5.3 daily_standup_report
生成每日站会报告

**参数**:
- `workspace_id`: 项目ID
- `user_id`: 用户ID

**模板逻辑**:
1. 查询用户昨日完成任务
2. 查询用户今日计划任务
3. 生成格式化报告

### 5.4 bug_triage
缺陷分类处理

**参数**:
- `workspace_id`: 项目ID
- `bug_ids`: 缺陷ID列表

**模板逻辑**:
1. 批量获取缺陷详情
2. 根据规则建议优先级和处理人
3. 提供批量更新操作

## 六、技术实现细节

### 6.1 API客户端封装

```typescript
class TapdApiClient {
  private authManager: TapdAuthManager;
  private baseUrl: string;
  
  async request<T>(
    method: string,
    endpoint: string,
    params?: Record<string, any>
  ): Promise<T>;
  
  // 专用方法
  async getStories(workspaceId: string, filters: StoryFilters): Promise<Story[]>;
  async getBugs(workspaceId: string, filters: BugFilters): Promise<Bug[]>;
}
```

### 6.2 查询构建器

支持TAPD特殊查询语法：
- 时间范围: `created=>2024-01-01`
- 枚举OR: `status=new|in_progress`
- 模糊匹配: `name=LIKE<keyword>`
- 多ID查询: `id=123,456,789`

```typescript
class QueryBuilder {
  buildQuery(filters: Record<string, any>): string;
  handleTimeRange(field: string, value: string): string;
  handleEnumOr(field: string, values: string[]): string;
}
```

### 6.3 分页处理

```typescript
interface PaginationOptions {
  limit?: number;  // 默认30, 最大200
  page?: number;   // 从1开始
}

class PaginationHandler {
  async fetchAll<T>(
    fetchFn: (page: number) => Promise<T[]>,
    maxPages?: number
  ): Promise<T[]>;
}
```

### 6.4 错误处理

**错误类型定义**:
```typescript
enum TapdErrorCode {
  AUTH_FAILED = 'AUTH_FAILED',
  INVALID_PARAMS = 'INVALID_PARAMS',
  NOT_FOUND = 'NOT_FOUND',
  RATE_LIMIT = 'RATE_LIMIT',
  NETWORK_ERROR = 'NETWORK_ERROR'
}

class TapdError extends Error {
  code: TapdErrorCode;
  details?: any;
}
```

**重试策略**:
- 401/403: 自动刷新token并重试1次
- 429 (Rate Limit): 指数退避重试
- 5xx: 最多重试3次
- 其他错误: 直接抛出

## 七、数据模型定义

### 7.1 核心业务对象

```typescript
interface Story {
  id: string;
  name: string;
  description: string;
  workspace_id: string;
  creator: string;
  created: string;
  modified: string;
  status: string;
  owner: string;
  priority: string;
  iteration_id?: string;
  begin?: string;
  due?: string;
  [key: string]: any;  // 自定义字段
}

interface Bug {
  id: string;
  title: string;
  description: string;
  workspace_id: string;
  reporter: string;
  current_owner: string;
  severity: string;
  priority: string;
  status: string;
  created: string;
  [key: string]: any;
}

interface Task {
  id: string;
  name: string;
  workspace_id: string;
  owner: string;
  status: string;
  created: string;
  [key: string]: any;
}
```

## 八、开发优先级

### Phase 1: 核心基础 (MVP)
1. 认证管理 (TapdAuthManager)
2. API客户端封装 (TapdApiClient)
3. 基础Tools:
   - tapd_list_stories
   - tapd_get_story
   - tapd_create_story
   - tapd_list_bugs
   - tapd_create_bug

### Phase 2: 完整CRUD
4. 补全所有业务对象的CRUD操作
5. Task和Iteration管理工具
6. 查询构建器优化
7. 分页和批量操作支持

### Phase 3: 高级特性
8. Resources实现
9. Prompts模板
10. Webhook管理工具
11. 自定义字段支持

### Phase 4: 优化增强
12. 缓存机制
13. 批量操作优化
14. 错误处理完善
15. 性能监控

## 九、项目结构建议

```
tapd-mcp-server/
├── src/
│   ├── index.ts                 # MCP服务入口
│   ├── auth/
│   │   └── TapdAuthManager.ts   # 认证管理
│   ├── api/
│   │   ├── TapdApiClient.ts     # API客户端
│   │   └── QueryBuilder.ts      # 查询构建器
│   ├── tools/
│   │   ├── story.ts             # Story相关工具
│   │   ├── bug.ts               # Bug相关工具
│   │   ├── task.ts              # Task相关工具
│   │   ├── iteration.ts         # Iteration相关工具
│   │   └── webhook.ts           # Webhook管理工具
│   ├── resources/
│   │   └── workspace.ts         # 资源定义
│   ├── prompts/
│   │   └── templates.ts         # 提示模板
│   ├── types/
│   │   └── tapd.ts              # 类型定义
│   └── utils/
│       ├── error.ts             # 错误处理
│       └── pagination.ts        # 分页处理
├── package.json
├── tsconfig.json
└── README.md
```

## 十、关键实现建议

### 10.1 配置管理
- 使用环境变量管理敏感信息
- 支持 .env 文件配置
- 提供默认值和验证

### 10.2 日志记录
- 使用结构化日志
- 记录所有API请求和响应
- 错误堆栈跟踪

### 10.3 测试策略
- 单元测试: 覆盖核心逻辑
- 集成测试: 测试API调用
- Mock TAPD API进行测试

### 10.4 文档
- API文档生成
- 使用示例
- 故障排查指南

## 十一、Tools完整清单

### Stories (需求)
- tapd_list_stories
- tapd_get_story
- tapd_create_story
- tapd_update_story
- tapd_delete_story
- tapd_count_stories

### Bugs (缺陷)
- tapd_list_bugs
- tapd_get_bug
- tapd_create_bug
- tapd_update_bug
- tapd_delete_bug
- tapd_count_bugs

### Tasks (任务)
- tapd_list_tasks
- tapd_get_task
- tapd_create_task
- tapd_update_task
- tapd_delete_task

### Iterations (迭代)
- tapd_list_iterations
- tapd_get_iteration
- tapd_create_iteration
- tapd_update_iteration

### Webhooks
- tapd_list_webhooks
- tapd_create_webhook
- tapd_update_webhook
- tapd_delete_webhook

### Workspace (项目空间)
- tapd_get_workspace
- tapd_list_workspaces

---

**文档版本**: 1.0  
**创建日期**: 2026-06-09  
**参考文档**: `./Docs/tapd文档/README.md`
