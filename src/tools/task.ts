import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { TapdApiClient } from '../api/TapdApiClient.js';
import { QueryBuilder } from '../api/QueryBuilder.js';
import { convertDataToArray, pickDefined } from '../utils/helpers.js';
import { buildTapdDetailContent, getTapdClientAuth } from '../utils/tapdImages.js';
import { resolveImageDiskSettings } from '../utils/imageConfig.js';
import { buildErrorResponse, buildListResponse, buildOperationResponse, toMcpError, toMcpText } from '../utils/response.js';

const TASK_FIELDS = [
  'name', 'description', 'status', 'owner', 'priority', 'priority_label',
  'iteration_id', 'begin', 'due', 'category_id',
  'story_id', 'effort', 'effort_completed', 'remain', 'exceed',
  'cc', 'label',
  'custom_field_one', 'custom_field_two', 'custom_field_three', 'custom_field_four',
  'custom_field_five', 'custom_field_six', 'custom_field_seven', 'custom_field_eight',
];

export function registerTaskTools(server: McpServer, client: TapdApiClient): void {
  server.registerTool(
    'tapd_list_tasks',
    {
      title: 'List TAPD Tasks',
      description: 'Search/filter tasks in a TAPD workspace. Returns a summary list - NOT full details. Use tapd_get_task to fetch a single task detail by ID. Common use cases: find tasks by owner, status, or related story_id.',
      inputSchema: {
        workspace_id: z.string().describe('TAPD workspace/project ID / 项目ID (from tapd_list_workspaces or TAPD URL, e.g. 48801209)'),
        id: z.string().optional().describe('Filter by task ID / 任务ID, supports multi-ID comma-separated'),
        status: z.string().optional().describe('Status / 状态, supports OR with |. Common: open(打开), progressing(进行中), done(已完成), suspended(已暂停). Values are workspace-configurable.'),
        owner: z.string().optional().describe('Owner/Handler / 处理人 (fuzzy match, TAPD user name)'),
        creator: z.string().optional().describe('Creator / 创建人 (supports multi-user with |)'),
        name: z.string().optional().describe('Fuzzy search by task name / 任务名称（模糊匹配, LIKE<keyword>）'),
        priority: z.string().optional().describe('Priority / 优先级 (numeric)'),
        priority_label: z.string().optional().describe('Priority label / 优先级标签（推荐使用，支持自定义优先级）'),
        iteration_id: z.string().optional().describe('Iteration ID / 迭代ID. Use "<>id" for NOT equal'),
        story_id: z.string().optional().describe('Related story ID / 关联需求ID'),
        created: z.string().optional().describe('Created time filter / 创建时间. Format: ">2026-01-01", "<2026-06-30", or "2026-01-01~2026-06-30"'),
        modified: z.string().optional().describe('Modified time filter / 最后修改时间. Format: ">2026-01-01", "<2026-06-30", or "2026-01-01~2026-06-30"'),
        completed: z.string().optional().describe('Completed time filter / 完成时间. Format: ">2026-01-01", "<2026-06-30", or "2026-01-01~2026-06-30"'),
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
          .add('owner', args.owner)
          .add('creator', args.creator)
          .addLike('name', args.name)
          .add('priority', args.priority)
          .add('priority_label', args.priority_label)
          .add('iteration_id', args.iteration_id)
          .add('story_id', args.story_id)
          .addTimeRange('created', args.created)
          .addTimeRange('modified', args.modified)
          .addTimeRange('completed', args.completed)
          .add('order', args.order)
          .addPagination(args.limit, args.page);

        if (args.fields) qb.add('fields', args.fields);

        const data = await client.get<Record<string, unknown>>('/tasks', Object.fromEntries(new URLSearchParams(qb.build())));
        return toMcpText(buildListResponse({
          tool: 'tapd_list_tasks',
          entityType: 'task',
          items: convertDataToArray(data),
          workspaceId: args.workspace_id,
          filters: pickDefined(args as Record<string, unknown>, ['id', 'status', 'owner', 'creator', 'name', 'priority', 'priority_label', 'iteration_id', 'story_id', 'created', 'modified', 'completed', 'order']),
          limit: args.limit,
          page: args.page,
        }));
      } catch (error) {
        return toMcpError(buildErrorResponse({ tool: 'tapd_list_tasks', error, workspaceId: args.workspace_id, entityType: 'task' }));
      }
    }
  );

  server.registerTool(
    'tapd_get_task',
    {
      title: 'Get TAPD Task Detail',
      description: 'Get FULL detail of a single task by its ID, including description (HTML). Images in the description are auto-downloaded to local disk by default and image URLs are replaced with local file paths. Set download_images=false to keep remote URLs. Use tapd_list_tasks first to find the task_id.',
      inputSchema: {
        workspace_id: z.string().describe('TAPD workspace/project ID / 项目ID'),
        task_id: z.string().describe('The task ID to retrieve / 任务ID (from tapd_list_tasks "id" field)'),
        fields: z.string().optional().describe('Return fields / 返回字段（逗号分隔）'),
        download_images: z.boolean().optional().describe('Download images in description to local disk & replace URLs with local paths. Defaults to env TAPD_IMAGE_DOWNLOAD_ENABLED (true). Set false to keep remote URLs.'),
        image_dir: z.string().optional().describe('Local directory for downloaded images. Defaults to env TAPD_IMAGE_DOWNLOAD_DIR (./.tapd-images).'),
      },
    },
    async (args) => {
      try {
        const params: Record<string, string> = { workspace_id: args.workspace_id, id: args.task_id };
        if (args.fields) params.fields = args.fields;

        const data = await client.get<Record<string, unknown>>('/tasks', params);
        const task = data ? Object.values(data)[0] : null;
        if (!task) return toMcpError(buildErrorResponse({ tool: 'tapd_get_task', error: new Error(`Task ${args.task_id} not found`), workspaceId: args.workspace_id, entityType: 'task', entityId: args.task_id }));
        const clientAuth = getTapdClientAuth(client);
        const imageSettings = resolveImageDiskSettings({ enabled: args.download_images, downloadDir: args.image_dir });
        return { content: await buildTapdDetailContent(task, { ...clientAuth, workspaceId: args.workspace_id, saveToDisk: imageSettings.enabled, downloadDir: imageSettings.downloadDir, downloadLimit: imageSettings.limit, concurrency: imageSettings.concurrency }) };
      } catch (error) {
        return toMcpError(buildErrorResponse({ tool: 'tapd_get_task', error, workspaceId: args.workspace_id, entityType: 'task', entityId: args.task_id }));
      }
    }
  );

  server.registerTool(
    'tapd_create_task',
    {
      title: 'Create TAPD Task',
      description: 'Create a new task in a TAPD workspace. "name" is required. Only provided fields are set; others use TAPD defaults.',
      inputSchema: {
        workspace_id: z.string().describe('TAPD workspace/project ID / 项目ID'),
        name: z.string().describe('Task name / 任务名称 (required)'),
        description: z.string().optional().describe('Task description / 详细描述 (HTML allowed)'),
        status: z.string().optional().describe('Status / 状态 (default: open). Common: open(打开), progressing(进行中), done(已完成), suspended(已暂停).'),
        owner: z.string().optional().describe('Owner/Handler / 处理人'),
        priority: z.string().optional().describe('Priority / 优先级'),
        priority_label: z.string().optional().describe('Priority label / 优先级（推荐使用，支持自定义优先级）'),
        iteration_id: z.string().optional().describe('Iteration ID / 迭代ID'),
        begin: z.string().optional().describe('Begin date / 预计开始 (YYYY-MM-DD)'),
        due: z.string().optional().describe('Due date / 预计结束 (YYYY-MM-DD)'),
        category_id: z.string().optional().describe('Category ID / 分类ID'),
        story_id: z.string().optional().describe('Related story ID / 关联需求ID'),
        effort: z.string().optional().describe('Estimated effort / 预估工时 (work hours)'),
        effort_completed: z.string().optional().describe('Completed effort / 完成工时'),
        remain: z.number().optional().describe('Remaining effort / 剩余工时'),
        exceed: z.number().optional().describe('Exceeded effort / 超出工时'),
        cc: z.string().optional().describe('CC/Copy-to users / 抄送人'),
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
          name: args.name,
          ...pickDefined(args as Record<string, unknown>, TASK_FIELDS),
        };

        const data = await client.post<Record<string, unknown>>('/tasks', body);
        const task = data ? Object.values(data)[0] : null;
        return toMcpText(buildOperationResponse({ tool: 'tapd_create_task', action: 'created', entityType: 'task', item: task, workspaceId: args.workspace_id }));
      } catch (error) {
        return toMcpError(buildErrorResponse({ tool: 'tapd_create_task', error, workspaceId: args.workspace_id, entityType: 'task' }));
      }
    }
  );

  server.registerTool(
    'tapd_update_task',
    {
      title: 'Update TAPD Task',
      description: 'Update an existing TAPD task. Only provided fields will be updated; omitted fields stay unchanged. Use tapd_get_task to verify before/after.',
      inputSchema: {
        workspace_id: z.string().describe('TAPD workspace/project ID / 项目ID'),
        task_id: z.string().describe('The task ID to update / 任务ID'),
        name: z.string().optional().describe('New task name / 任务名称'),
        description: z.string().optional().describe('New description / 详细描述 (HTML allowed)'),
        status: z.string().optional().describe('New status / 状态. Common: open(打开), progressing(进行中), done(已完成), suspended(已暂停).'),
        owner: z.string().optional().describe('New owner/handler / 处理人'),
        priority: z.string().optional().describe('New priority / 优先级'),
        priority_label: z.string().optional().describe('New priority label / 优先级（推荐使用）'),
        iteration_id: z.string().optional().describe('New iteration ID / 迭代ID'),
        begin: z.string().optional().describe('New begin date / 预计开始 (YYYY-MM-DD)'),
        due: z.string().optional().describe('New due date / 预计结束 (YYYY-MM-DD)'),
        category_id: z.string().optional().describe('New category ID / 分类ID'),
        effort_completed: z.string().optional().describe('Completed effort / 完成工时'),
        remain: z.number().optional().describe('Remaining effort / 剩余工时'),
        cc: z.string().optional().describe('CC/Copy-to users / 抄送人'),
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
          id: args.task_id,
          ...pickDefined(args as Record<string, unknown>, TASK_FIELDS),
        };

        const data = await client.post<Record<string, unknown>>('/tasks', body);
        const task = data ? Object.values(data)[0] : null;
        return toMcpText(buildOperationResponse({ tool: 'tapd_update_task', action: 'updated', entityType: 'task', item: task, entityId: args.task_id, workspaceId: args.workspace_id }));
      } catch (error) {
        return toMcpError(buildErrorResponse({ tool: 'tapd_update_task', error, workspaceId: args.workspace_id, entityType: 'task', entityId: args.task_id }));
      }
    }
  );

  server.registerTool(
    'tapd_delete_task',
    {
      title: 'Delete TAPD Task',
      description: 'Delete a TAPD task (soft-delete via status=deleted). The task is moved to trash, not permanently erased.',
      inputSchema: {
        workspace_id: z.string().describe('TAPD workspace/project ID / 项目ID'),
        task_id: z.string().describe('The task ID to delete / 任务ID'),
      },
    },
    async (args) => {
      try {
        await client.post('/tasks', {
          workspace_id: args.workspace_id,
          id: args.task_id,
          status: 'deleted',
        });
        return toMcpText(buildOperationResponse({ tool: 'tapd_delete_task', action: 'deleted', entityType: 'task', entityId: args.task_id, workspaceId: args.workspace_id }));
      } catch (error) {
        return toMcpError(buildErrorResponse({ tool: 'tapd_delete_task', error, workspaceId: args.workspace_id, entityType: 'task', entityId: args.task_id }));
      }
    }
  );

  server.registerTool(
    'tapd_batch_update_tasks',
    {
      title: 'Batch Update TAPD Tasks',
      description: 'Update multiple tasks at once with the SAME field values (e.g. assign all to one owner, or change status for many). More efficient than calling tapd_update_task repeatedly. Use task_ids (comma-separated).',
      inputSchema: {
        workspace_id: z.string().describe('TAPD workspace/project ID / 项目ID'),
        task_ids: z.string().describe('Comma-separated task IDs / 任务ID列表, e.g. "123,456,789"'),
        status: z.string().optional().describe('New status / 状态. Common: open(打开), progressing(进行中), done(已完成), suspended(已暂停).'),
        owner: z.string().optional().describe('New owner / 处理人'),
        priority: z.string().optional().describe('New priority / 优先级 (numeric)'),
      },
    },
    async (args) => {
      try {
        const ids = args.task_ids.split(',').map(id => id.trim());
        const fields = pickDefined(args as Record<string, unknown>, ['status', 'owner', 'priority', 'priority_label']);

        const workitems = ids.map(id => ({ id, ...fields }));

        const body = {
          workspace_id: args.workspace_id,
          workitems,
        };
        await client.post('/tasks/batch_update_task', body);
        return toMcpText(buildOperationResponse({ tool: 'tapd_batch_update_tasks', action: 'updated', entityType: 'task', workspaceId: args.workspace_id }));
      } catch (error) {
        return toMcpError(buildErrorResponse({ tool: 'tapd_batch_update_tasks', error, workspaceId: args.workspace_id, entityType: 'task' }));
      }
    }
  );
}
