import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { TapdApiClient } from '../api/TapdApiClient.js';
import { QueryBuilder } from '../api/QueryBuilder.js';
import { convertDataToArray, pickDefined } from '../utils/helpers.js';
import { buildTapdDetailContent, getTapdClientAuth } from '../utils/tapdImages.js';
import { buildCountResponse, buildErrorResponse, buildListResponse, buildOperationResponse, toMcpError, toMcpText } from '../utils/response.js';

const BUG_FIELDS = [
  'title', 'description', 'severity', 'priority', 'priority_label',
  'current_owner', 'status', 'deadline', 'due', 'resolution',
  'platform', 'os', 'source', 'module', 'iteration_id',
  'reporter', 'cc', 'begin',
  'version_report', 'version_test', 'version_close',
  'baseline_find', 'baseline_join', 'baseline_test', 'baseline_close',
  'bugtype', 'effort', 'label',
  'custom_field_one', 'custom_field_two', 'custom_field_three', 'custom_field_four',
  'custom_field_five', 'custom_field_six', 'custom_field_seven', 'custom_field_eight',
];

export function registerBugTools(server: McpServer, client: TapdApiClient): void {
  server.registerTool(
    'tapd_list_bugs',
    {
      title: 'List TAPD Bugs',
      description: 'List bugs (defects) in a TAPD workspace with filtering and pagination. Returns an array of bug objects.',
      inputSchema: {
        workspace_id: z.string().describe('TAPD workspace/project ID / 项目ID'),
        id: z.string().optional().describe('Filter by bug ID / 缺陷ID, supports multi-ID query'),
        status: z.string().optional().describe('Status / 状态, supports OR with |. Common values: new(新建), in_progress(处理中), resolved(已解决), closed(已关闭), reopened(重新打开), rejected(已拒绝), postponed(延期处理), verified(已验证)'),
        severity: z.string().optional().describe('Severity / 严重程度: fatal(致命)|serious(严重)|normal(一般)|slight(轻微)|suggest(建议)'),
        priority: z.string().optional().describe('Priority / 优先级: urgent|high|medium|low|insignificant'),
        priority_label: z.string().optional().describe('Priority label / 优先级（推荐使用）'),
        current_owner: z.string().optional().describe('Current handler / 当前处理人, supports fuzzy match'),
        reporter: z.string().optional().describe('Reporter / 报告人, supports fuzzy match'),
        creator: z.string().optional().describe('Creator / 创建人, supports multi-user query'),
        title: z.string().optional().describe('Fuzzy search by bug title / 标题（模糊匹配）'),
        iteration_id: z.string().optional().describe('Iteration ID / 迭代ID. Use "<>id" for not equal'),
        module: z.string().optional().describe('Module / 模块'),
        label: z.string().optional().describe('Label / 标签, supports enum query'),
        created: z.string().optional().describe('Created time / 创建时间. Supports >date, <date, date~date'),
        modified: z.string().optional().describe('Modified time / 最后修改时间. Supports >date, <date, date~date'),
        resolved: z.string().optional().describe('Resolved time / 解决时间. Supports >date, <date, date~date'),
        closed: z.string().optional().describe('Closed time / 关闭时间. Supports >date, <date, date~date'),
        order: z.string().optional().describe('Sort order / 排序规则 (e.g. "created desc"), requires urlencode'),
        limit: z.number().optional().describe('Results per page / 每页数量（默认30，最大200）'),
        page: z.number().optional().describe('Page number / 页码（从1开始）'),
        fields: z.string().optional().describe('Return fields / 返回字段（逗号分隔）'),
      },
    },
    async (args) => {
      try {
        const qb = new QueryBuilder()
          .add('workspace_id', args.workspace_id)
          .add('id', args.id)
          .addEnumOr('status', args.status)
          .addEnumOr('severity', args.severity)
          .addEnumOr('priority', args.priority)
          .add('priority_label', args.priority_label)
          .add('current_owner', args.current_owner)
          .add('reporter', args.reporter)
          .add('creator', args.creator)
          .addLike('title', args.title)
          .add('iteration_id', args.iteration_id)
          .add('module', args.module)
          .addEnumOr('label', args.label)
          .addTimeRange('created', args.created)
          .addTimeRange('modified', args.modified)
          .addTimeRange('resolved', args.resolved)
          .addTimeRange('closed', args.closed)
          .add('order', args.order)
          .addPagination(args.limit, args.page);

        if (args.fields) qb.add('fields', args.fields);

        const data = await client.get<Record<string, unknown>>('/bugs', Object.fromEntries(new URLSearchParams(qb.build())));
        return toMcpText(buildListResponse({
          tool: 'tapd_list_bugs',
          entityType: 'bug',
          items: convertDataToArray(data),
          workspaceId: args.workspace_id,
          filters: pickDefined(args as Record<string, unknown>, ['id', 'status', 'severity', 'priority', 'priority_label', 'current_owner', 'reporter', 'creator', 'title', 'iteration_id', 'module', 'label', 'created', 'modified', 'resolved', 'closed', 'order']),
          limit: args.limit,
          page: args.page,
        }));
      } catch (error) {
        return toMcpError(buildErrorResponse({ tool: 'tapd_list_bugs', error, workspaceId: args.workspace_id, entityType: 'bug' }));
      }
    }
  );

  server.registerTool(
    'tapd_get_bug',
    {
      title: 'Get TAPD Bug Detail',
      description: 'Get detailed information about a specific TAPD bug by its ID.',
      inputSchema: {
        workspace_id: z.string().describe('TAPD workspace/project ID / 项目ID'),
        bug_id: z.string().describe('The bug ID to retrieve / 缺陷ID'),
        fields: z.string().optional().describe('Return fields / 返回字段（逗号分隔）'),
      },
    },
    async (args) => {
      try {
        const params: Record<string, string> = { workspace_id: args.workspace_id, id: args.bug_id };
        if (args.fields) params.fields = args.fields;

        const data = await client.get<Record<string, unknown>>('/bugs', params);
        const bug = data ? Object.values(data)[0] : null;
        if (!bug) return toMcpError(buildErrorResponse({ tool: 'tapd_get_bug', error: new Error(`Bug ${args.bug_id} not found`), workspaceId: args.workspace_id, entityType: 'bug', entityId: args.bug_id }));
        const clientAuth = getTapdClientAuth(client);
        return { content: await buildTapdDetailContent(bug, { ...clientAuth, workspaceId: args.workspace_id }) };
      } catch (error) {
        return toMcpError(buildErrorResponse({ tool: 'tapd_get_bug', error, workspaceId: args.workspace_id, entityType: 'bug', entityId: args.bug_id }));
      }
    }
  );

  server.registerTool(
    'tapd_create_bug',
    {
      title: 'Create TAPD Bug',
      description: 'Create a new bug (defect) in a TAPD workspace.',
      inputSchema: {
        workspace_id: z.string().describe('TAPD workspace/project ID / 项目ID'),
        title: z.string().describe('Bug title / 缺陷标题 (required)'),
        description: z.string().optional().describe('Bug description / 详细描述'),
        severity: z.string().optional().describe('Severity / 严重程度: fatal(致命)|serious(严重)|normal(一般)|slight(轻微)|suggest(建议)'),
        priority: z.string().optional().describe('Priority / 优先级: urgent|high|medium|low|insignificant'),
        priority_label: z.string().optional().describe('Priority label / 优先级（推荐使用，支持自定义优先级）'),
        current_owner: z.string().optional().describe('Current handler / 当前处理人'),
        reporter: z.string().optional().describe('Reporter / 报告人'),
        cc: z.string().optional().describe('CC/Copy-to users / 抄送人'),
        status: z.string().optional().describe('Status / 状态 (default: new). Common values: new(新建), in_progress(处理中), resolved(已解决), closed(已关闭), reopened(重新打开), rejected(已拒绝), postponed(延期处理), verified(已验证)'),
        deadline: z.string().optional().describe('Deadline / 解决期限 (YYYY-MM-DD)'),
        due: z.string().optional().describe('Due date / 预计结束 (YYYY-MM-DD)'),
        begin: z.string().optional().describe('Begin date / 预计开始 (YYYY-MM-DD)'),
        platform: z.string().optional().describe('Platform / 平台'),
        os: z.string().optional().describe('OS / 操作系统'),
        source: z.string().optional().describe('Source / 来源'),
        module: z.string().optional().describe('Module / 模块'),
        iteration_id: z.string().optional().describe('Iteration ID / 迭代ID'),
        version_report: z.string().optional().describe('Report version / 发现版本'),
        version_test: z.string().optional().describe('Test version / 测试版本'),
        version_close: z.string().optional().describe('Close version / 关闭版本'),
        baseline_find: z.string().optional().describe('Find baseline / 发现基线'),
        baseline_join: z.string().optional().describe('Join baseline / 加入基线'),
        baseline_test: z.string().optional().describe('Test baseline / 测试基线'),
        baseline_close: z.string().optional().describe('Close baseline / 关闭基线'),
        bugtype: z.string().optional().describe('Bug type / 缺陷类型'),
        effort: z.string().optional().describe('Estimated effort / 预估工时'),
        label: z.string().optional().describe('Label / 标签（多个以|分隔）'),
        custom_field_one: z.string().optional().describe('Custom field 1 / 自定义字段'),
        custom_field_two: z.string().optional().describe('Custom field 2 / 自定义字段'),
        custom_field_three: z.string().optional().describe('Custom field 3 / 自定义字段'),
        custom_field_four: z.string().optional().describe('Custom field 4 / 自定义字段'),
        custom_field_five: z.string().optional().describe('Custom field 5 / 自定义字段'),
        custom_field_six: z.string().optional().describe('Custom field 6 / 自定义字段'),
        custom_field_seven: z.string().optional().describe('Custom field 7 / 自定义字段'),
        custom_field_eight: z.string().optional().describe('Custom field 8 / 自定义字段'),
      },
    },
    async (args) => {
      try {
        const body: Record<string, unknown> = {
          workspace_id: args.workspace_id,
          title: args.title,
          ...pickDefined(args as Record<string, unknown>, BUG_FIELDS),
        };

        const data = await client.post<Record<string, unknown>>('/bugs', body);
        const bug = data ? Object.values(data)[0] : null;
        return toMcpText(buildOperationResponse({ tool: 'tapd_create_bug', action: 'created', entityType: 'bug', item: bug, workspaceId: args.workspace_id }));
      } catch (error) {
        return toMcpError(buildErrorResponse({ tool: 'tapd_create_bug', error, workspaceId: args.workspace_id, entityType: 'bug' }));
      }
    }
  );

  server.registerTool(
    'tapd_update_bug',
    {
      title: 'Update TAPD Bug',
      description: 'Update an existing TAPD bug. Only provided fields will be updated.',
      inputSchema: {
        workspace_id: z.string().describe('TAPD workspace/project ID / 项目ID'),
        bug_id: z.string().describe('The bug ID to update / 缺陷ID'),
        title: z.string().optional().describe('New bug title / 标题'),
        description: z.string().optional().describe('New description / 详细描述'),
        severity: z.string().optional().describe('New severity / 严重程度: fatal(致命)|serious(严重)|normal(一般)|slight(轻微)|suggest(建议)'),
        priority: z.string().optional().describe('New priority / 优先级: urgent|high|medium|low|insignificant'),
        priority_label: z.string().optional().describe('New priority label / 优先级（推荐使用）'),
        current_owner: z.string().optional().describe('New handler / 当前处理人'),
        status: z.string().optional().describe('New status / 状态. Common values: new(新建), in_progress(处理中), resolved(已解决), closed(已关闭), reopened(重新打开), rejected(已拒绝), postponed(延期处理), verified(已验证)'),
        deadline: z.string().optional().describe('New deadline / 解决期限 (YYYY-MM-DD)'),
        due: z.string().optional().describe('New due date / 预计结束 (YYYY-MM-DD)'),
        begin: z.string().optional().describe('New begin date / 预计开始 (YYYY-MM-DD)'),
        resolution: z.string().optional().describe('Resolution / 解决方案'),
        platform: z.string().optional().describe('New platform / 平台'),
        os: z.string().optional().describe('New OS / 操作系统'),
        source: z.string().optional().describe('New source / 来源'),
        module: z.string().optional().describe('New module / 模块'),
        iteration_id: z.string().optional().describe('New iteration ID / 迭代ID'),
        reporter: z.string().optional().describe('New reporter / 报告人'),
        cc: z.string().optional().describe('CC/Copy-to users / 抄送人'),
        version_report: z.string().optional().describe('Report version / 发现版本'),
        version_test: z.string().optional().describe('Test version / 测试版本'),
        version_close: z.string().optional().describe('Close version / 关闭版本'),
        baseline_find: z.string().optional().describe('Find baseline / 发现基线'),
        baseline_join: z.string().optional().describe('Join baseline / 加入基线'),
        baseline_test: z.string().optional().describe('Test baseline / 测试基线'),
        baseline_close: z.string().optional().describe('Close baseline / 关闭基线'),
        bugtype: z.string().optional().describe('Bug type / 缺陷类型'),
        effort: z.string().optional().describe('Estimated effort / 预估工时'),
        label: z.string().optional().describe('Label / 标签（多个以|分隔）'),
        custom_field_one: z.string().optional().describe('Custom field 1 / 自定义字段'),
        custom_field_two: z.string().optional().describe('Custom field 2 / 自定义字段'),
        custom_field_three: z.string().optional().describe('Custom field 3 / 自定义字段'),
        custom_field_four: z.string().optional().describe('Custom field 4 / 自定义字段'),
        custom_field_five: z.string().optional().describe('Custom field 5 / 自定义字段'),
        custom_field_six: z.string().optional().describe('Custom field 6 / 自定义字段'),
        custom_field_seven: z.string().optional().describe('Custom field 7 / 自定义字段'),
        custom_field_eight: z.string().optional().describe('Custom field 8 / 自定义字段'),
      },
    },
    async (args) => {
      try {
        const body: Record<string, unknown> = {
          workspace_id: args.workspace_id,
          id: args.bug_id,
          ...pickDefined(args as Record<string, unknown>, BUG_FIELDS),
        };

        const data = await client.post<Record<string, unknown>>('/bugs', body);
        const bug = data ? Object.values(data)[0] : null;
        return toMcpText(buildOperationResponse({ tool: 'tapd_update_bug', action: 'updated', entityType: 'bug', item: bug, entityId: args.bug_id, workspaceId: args.workspace_id }));
      } catch (error) {
        return toMcpError(buildErrorResponse({ tool: 'tapd_update_bug', error, workspaceId: args.workspace_id, entityType: 'bug', entityId: args.bug_id }));
      }
    }
  );

  server.registerTool(
    'tapd_count_bugs',
    {
      title: 'Count TAPD Bugs',
      description: 'Count the number of bugs matching the given filters in a TAPD workspace.',
      inputSchema: {
        workspace_id: z.string().describe('TAPD workspace/project ID / 项目ID'),
        id: z.string().optional().describe('Filter by bug ID / 缺陷ID'),
        status: z.string().optional().describe('Filter by status / 状态'),
        severity: z.string().optional().describe('Filter by severity / 严重程度'),
        priority: z.string().optional().describe('Filter by priority / 优先级'),
        priority_label: z.string().optional().describe('Filter by priority label / 优先级'),
        current_owner: z.string().optional().describe('Filter by current handler / 当前处理人'),
        reporter: z.string().optional().describe('Filter by reporter / 报告人'),
        creator: z.string().optional().describe('Filter by creator / 创建人'),
        iteration_id: z.string().optional().describe('Filter by iteration ID / 迭代ID'),
        module: z.string().optional().describe('Filter by module / 模块'),
        label: z.string().optional().describe('Filter by label / 标签'),
        created: z.string().optional().describe('Filter by created time range / 创建时间'),
        modified: z.string().optional().describe('Filter by modified time range / 最后修改时间'),
        resolved: z.string().optional().describe('Filter by resolved time range / 解决时间'),
        closed: z.string().optional().describe('Filter by closed time range / 关闭时间'),
      },
    },
    async (args) => {
      try {
        const qb = new QueryBuilder()
          .add('workspace_id', args.workspace_id)
          .add('id', args.id)
          .addEnumOr('status', args.status)
          .addEnumOr('severity', args.severity)
          .addEnumOr('priority', args.priority)
          .add('priority_label', args.priority_label)
          .add('current_owner', args.current_owner)
          .add('reporter', args.reporter)
          .add('creator', args.creator)
          .add('iteration_id', args.iteration_id)
          .add('module', args.module)
          .addEnumOr('label', args.label)
          .addTimeRange('created', args.created)
          .addTimeRange('modified', args.modified)
          .addTimeRange('resolved', args.resolved)
          .addTimeRange('closed', args.closed);

        const data = await client.get<{ count: number }>('/bugs/count', Object.fromEntries(new URLSearchParams(qb.build())));
        return toMcpText(buildCountResponse({
          tool: 'tapd_count_bugs',
          entityType: 'bug',
          count: data,
          workspaceId: args.workspace_id,
          filters: pickDefined(args as Record<string, unknown>, ['id', 'status', 'severity', 'priority', 'priority_label', 'current_owner', 'reporter', 'creator', 'iteration_id', 'module', 'label', 'created', 'modified', 'resolved', 'closed']),
        }));
      } catch (error) {
        return toMcpError(buildErrorResponse({ tool: 'tapd_count_bugs', error, workspaceId: args.workspace_id, entityType: 'bug' }));
      }
    }
  );

  server.registerTool(
    'tapd_delete_bug',
    {
      title: 'Delete TAPD Bug',
      description: 'Delete a TAPD bug by its ID.',
      inputSchema: {
        workspace_id: z.string().describe('TAPD workspace/project ID / 项目ID'),
        bug_id: z.string().describe('The bug ID to delete / 缺陷ID'),
      },
    },
    async (args) => {
      try {
        await client.post('/bugs', {
          workspace_id: args.workspace_id,
          id: args.bug_id,
          status: 'deleted',
        });
        return toMcpText(buildOperationResponse({ tool: 'tapd_delete_bug', action: 'deleted', entityType: 'bug', entityId: args.bug_id, workspaceId: args.workspace_id }));
      } catch (error) {
        return toMcpError(buildErrorResponse({ tool: 'tapd_delete_bug', error, workspaceId: args.workspace_id, entityType: 'bug', entityId: args.bug_id }));
      }
    }
  );

  server.registerTool(
    'tapd_batch_update_bugs',
    {
      title: 'Batch Update TAPD Bugs',
      description: 'Update multiple bugs at once with the same field values.',
      inputSchema: {
        workspace_id: z.string().describe('TAPD workspace/project ID / 项目ID'),
        bug_ids: z.string().describe('Comma-separated bug IDs / 缺陷ID列表'),
        status: z.string().optional().describe('New status / 状态. Common values: new(新建), in_progress(处理中), resolved(已解决), closed(已关闭), reopened(重新打开), rejected(已拒绝), postponed(延期处理), verified(已验证)'),
        current_owner: z.string().optional().describe('New owner / 当前处理人'),
        severity: z.string().optional().describe('New severity / 严重程度: fatal(致命)|serious(严重)|normal(一般)|slight(轻微)|suggest(建议)'),
        priority: z.string().optional().describe('New priority / 优先级: urgent|high|medium|low|insignificant'),
      },
    },
    async (args) => {
      try {
        const ids = args.bug_ids.split(',').map(id => id.trim());
        const fields = pickDefined(args as Record<string, unknown>, ['status', 'current_owner', 'severity', 'priority', 'priority_label']);

        const workitems = ids.map(id => ({ id, ...fields }));

        const body = {
          workspace_id: args.workspace_id,
          project_id: args.workspace_id,
          workitems,
        };
        await client.post('/bugs/batch_update_bug', body);
        return toMcpText(buildOperationResponse({ tool: 'tapd_batch_update_bugs', action: 'updated', entityType: 'bug', workspaceId: args.workspace_id }));
      } catch (error) {
        return toMcpError(buildErrorResponse({ tool: 'tapd_batch_update_bugs', error, workspaceId: args.workspace_id, entityType: 'bug' }));
      }
    }
  );
}
