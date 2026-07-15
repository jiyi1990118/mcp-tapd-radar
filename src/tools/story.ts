import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { TapdApiClient } from '../api/TapdApiClient.js';
import { QueryBuilder } from '../api/QueryBuilder.js';
import { convertDataToArray, pickDefined } from '../utils/helpers.js';
import { buildTapdDetailContent, getTapdClientAuth } from '../utils/tapdImages.js';
import { resolveImageDiskSettings } from '../utils/imageConfig.js';
import { buildErrorResponse, buildListResponse, buildOperationResponse, toMcpError, toMcpText } from '../utils/response.js';

const STORY_FIELDS = [
  'name', 'description', 'status', 'owner', 'priority', 'priority_label',
  'iteration_id', 'begin', 'due', 'size', 'category_id',
  'effort', 'effort_completed', 'remain', 'exceed',
  'developer', 'cc', 'version', 'module', 'test_focus',
  'business_value', 'source', 'type', 'feature', 'tech_risk',
  'release_id', 'workitem_type_id', 'label', 'parent_id', 'templated_id',
  'current_user',
  'custom_field_one', 'custom_field_two', 'custom_field_three', 'custom_field_four',
  'custom_field_five', 'custom_field_six', 'custom_field_seven', 'custom_field_eight',
];

export function registerStoryTools(server: McpServer, client: TapdApiClient): void {
  server.registerTool(
    'tapd_list_stories',
    {
      title: 'List TAPD Stories',
      description: 'Search/filter stories (requirements) in a TAPD workspace. Returns a summary list (id, name, status, owner, etc.) - NOT full details. Use tapd_get_story to fetch a single story detail by ID. Common use cases: find stories by iteration, owner, status, or keyword.',
      inputSchema: {
        workspace_id: z.string().describe('TAPD workspace/project ID / 项目ID (from tapd_list_workspaces or TAPD URL, e.g. 48801209)'),
        id: z.string().optional().describe('Filter by story ID / 需求ID, supports multi-ID comma-separated'),
        status: z.string().optional().describe('Status / 状态, supports OR with |. Common: new(新建), planning(规划中), planned(需求排期), developing(开发中), testing(测试中), resolved(已解决), done(已完成), closed(已关闭), reopened(重新打开), rejected(已拒绝), draft(草稿). Values are workspace-configurable.'),
        v_status: z.string().optional().describe('Status (Chinese name) / 状态（中文名称）, e.g. "规划中", "开发中". Use if unsure of the English status code.'),
        with_v_status: z.string().optional().describe('Return Chinese status name / 返回中文状态 (1=yes)'),
        owner: z.string().optional().describe('Owner/Handler / 处理人 (fuzzy match, TAPD user name)'),
        creator: z.string().optional().describe('Creator / 创建人 (supports multi-user with |)'),
        developer: z.string().optional().describe('Developer / 开发人员'),
        priority: z.string().optional().describe('Priority / 优先级 (numeric)'),
        priority_label: z.string().optional().describe('Priority label / 优先级标签（推荐，支持自定义优先级）'),
        iteration_id: z.string().optional().describe('Iteration ID / 迭代ID. Use "<>id" for NOT equal'),
        category_id: z.string().optional().describe('Category ID / 需求分类 (supports enum query)'),
        workitem_type_id: z.string().optional().describe('Work item type ID / 需求类别ID (supports enum query)'),
        label: z.string().optional().describe('Label / 标签 (supports enum query)'),
        parent_id: z.string().optional().describe('Parent story ID / 父需求ID'),
        include_sub_iteration: z.string().optional().describe('Include sub-iterations / 包含子迭代 (0/1)'),
        include_sub_category: z.string().optional().describe('Include sub-categories / 包含子分类 (0/1)'),
        include_leaf_stories: z.string().optional().describe('Include child stories / 包含子需求 (0/1)'),
        created: z.string().optional().describe('Created time filter / 创建时间. Format: ">2026-01-01", "<2026-06-30", or "2026-01-01~2026-06-30"'),
        modified: z.string().optional().describe('Modified time filter / 最后修改时间. Format: ">2026-01-01", "<2026-06-30", or "2026-01-01~2026-06-30"'),
        completed: z.string().optional().describe('Completed time filter / 完成时间. Format: ">2026-01-01", "<2026-06-30", or "2026-01-01~2026-06-30"'),
        begin: z.string().optional().describe('Begin date filter / 预计开始. Format: ">2026-01-01", "<2026-06-30", or "2026-01-01~2026-06-30"'),
        due: z.string().optional().describe('Due date filter / 预计结束. Format: ">2026-01-01", "<2026-06-30", or "2026-01-01~2026-06-30"'),
        description: z.string().optional().describe('Fuzzy search by description / 详细描述（模糊匹配）'),
        name: z.string().optional().describe('Fuzzy search by story name / 标题（模糊匹配, LIKE<keyword>）'),
        order: z.string().optional().describe('Sort order / 排序规则 (e.g. "created desc", "priority asc"), requires urlencode'),
        limit: z.number().optional().describe('Results per page / 每页数量（默认30，最大200）'),
        page: z.number().optional().describe('Page number / 页码（从1开始）'),
        fields: z.string().optional().describe('Return fields / 返回字段（逗号分隔，e.g. "id,name,status"）'),
      },
    },
    async (args) => {
      try {
        const qb = new QueryBuilder()
          .add('workspace_id', args.workspace_id)
          .add('id', args.id)
          .addEnumOr('status', args.status)
          .add('v_status', args.v_status)
          .add('with_v_status', args.with_v_status)
          .add('owner', args.owner)
          .add('creator', args.creator)
          .add('developer', args.developer)
          .add('priority', args.priority)
          .add('priority_label', args.priority_label)
          .add('iteration_id', args.iteration_id)
          .add('category_id', args.category_id)
          .addEnumOr('workitem_type_id', args.workitem_type_id)
          .addEnumOr('label', args.label)
          .add('parent_id', args.parent_id)
          .add('include_sub_iteration', args.include_sub_iteration)
          .add('include_sub_category', args.include_sub_category)
          .add('include_leaf_stories', args.include_leaf_stories)
          .addTimeRange('created', args.created)
          .addTimeRange('modified', args.modified)
          .addTimeRange('completed', args.completed)
          .addTimeRange('begin', args.begin)
          .addTimeRange('due', args.due)
          .addLike('name', args.name)
          .addLike('description', args.description)
          .add('order', args.order)
          .addPagination(args.limit, args.page);

        if (args.fields) qb.add('fields', args.fields);

        const data = await client.get<Record<string, unknown>>('/stories', Object.fromEntries(new URLSearchParams(qb.build())));
        return toMcpText(buildListResponse({
          tool: 'tapd_list_stories',
          entityType: 'story',
          items: convertDataToArray(data),
          workspaceId: args.workspace_id,
          filters: pickDefined(args as Record<string, unknown>, ['id', 'status', 'v_status', 'owner', 'creator', 'developer', 'priority', 'priority_label', 'iteration_id', 'category_id', 'workitem_type_id', 'label', 'parent_id', 'created', 'modified', 'completed', 'begin', 'due', 'name', 'description', 'order']),
          limit: args.limit,
          page: args.page,
        }));
      } catch (error) {
        return toMcpError(buildErrorResponse({ tool: 'tapd_list_stories', error, workspaceId: args.workspace_id, entityType: 'story' }));
      }
    }
  );

  server.registerTool(
    'tapd_get_story',
    {
      title: 'Get TAPD Story Detail',
      description: 'Get FULL detail of a single story by its ID, including description (HTML). Images in the description are auto-downloaded to local disk by default and image URLs are replaced with local file paths - so the returned text contains local paths (not base64). Set download_images=false to keep remote URLs / inline base64. Use tapd_list_stories first to find the story_id.',
      inputSchema: {
        workspace_id: z.string().describe('TAPD workspace/project ID / 项目ID'),
        story_id: z.string().describe('The story ID to retrieve / 需求ID (from tapd_list_stories "id" field)'),
        fields: z.string().optional().describe('Return fields / 返回字段（逗号分隔）'),
        download_images: z.boolean().optional().describe('Download images in description to local disk & replace URLs with local paths. Defaults to env TAPD_IMAGE_DOWNLOAD_ENABLED (true). Set false to keep remote URLs.'),
        image_dir: z.string().optional().describe('Local directory for downloaded images. Defaults to env TAPD_IMAGE_DOWNLOAD_DIR (./.tapd-images).'),
      },
    },
    async (args) => {
      try {
        const params: Record<string, string> = { workspace_id: args.workspace_id, id: args.story_id };
        if (args.fields) params.fields = args.fields;

        const data = await client.get<Record<string, unknown>>('/stories', params);
        const story = data ? Object.values(data)[0] : null;
        if (!story) return toMcpError(buildErrorResponse({ tool: 'tapd_get_story', error: new Error(`Story ${args.story_id} not found`), workspaceId: args.workspace_id, entityType: 'story', entityId: args.story_id }));
        const clientAuth = getTapdClientAuth(client);
        const imageSettings = resolveImageDiskSettings({ enabled: args.download_images, downloadDir: args.image_dir });
        return { content: await buildTapdDetailContent(story, { ...clientAuth, workspaceId: args.workspace_id, saveToDisk: imageSettings.enabled, downloadDir: imageSettings.downloadDir, downloadLimit: imageSettings.limit, concurrency: imageSettings.concurrency }) };
      } catch (error) {
        return toMcpError(buildErrorResponse({ tool: 'tapd_get_story', error, workspaceId: args.workspace_id, entityType: 'story', entityId: args.story_id }));
      }
    }
  );

  server.registerTool(
    'tapd_create_story',
    {
      title: 'Create TAPD Story',
      description: 'Create a new story (requirement) in a TAPD workspace. "name" is required. Only provided fields are set; others use TAPD defaults.',
      inputSchema: {
        workspace_id: z.string().describe('TAPD workspace/project ID / 项目ID'),
        name: z.string().describe('Story title / 标题 (required)'),
        description: z.string().optional().describe('Story description / 详细描述 (HTML allowed)'),
        status: z.string().optional().describe('Status / 状态 (default: new). Common: new, planning, planned, developing, testing, resolved, done, closed, reopened, rejected, draft. Values are workspace-configurable.'),
        owner: z.string().optional().describe('Handler/Owner / 处理人'),
        priority: z.string().optional().describe('Priority / 优先级'),
        priority_label: z.string().optional().describe('Priority label / 优先级（推荐使用，支持自定义优先级）'),
        iteration_id: z.string().optional().describe('Iteration ID / 迭代ID'),
        begin: z.string().optional().describe('Begin date / 预计开始 (YYYY-MM-DD)'),
        due: z.string().optional().describe('Due date / 预计结束 (YYYY-MM-DD)'),
        size: z.string().optional().describe('Story size/scale / 规模'),
        category_id: z.string().optional().describe('Category ID / 需求分类'),
        effort: z.union([z.string(), z.number()]).optional().describe('Estimated effort / 预估工时 (work hours / person-days)'),
        effort_completed: z.string().optional().describe('Completed effort / 完成工时'),
        remain: z.number().optional().describe('Remaining effort / 剩余工时'),
        exceed: z.number().optional().describe('Exceeded effort / 超出工时'),
        developer: z.string().optional().describe('Developer / 开发人员'),
        cc: z.string().optional().describe('CC/Copy-to users / 抄送人'),
        version: z.string().optional().describe('Version / 版本'),
        module: z.string().optional().describe('Module / 模块'),
        test_focus: z.string().optional().describe('Test focus / 测试重点'),
        business_value: z.number().optional().describe('Business value / 业务价值'),
        source: z.string().optional().describe('Source / 来源'),
        type: z.string().optional().describe('Type / 类型'),
        feature: z.string().optional().describe('Feature / 特性'),
        tech_risk: z.string().optional().describe('Technical risk / 技术风险'),
        release_id: z.string().optional().describe('Release plan ID / 发布计划'),
        workitem_type_id: z.string().optional().describe('Work item type/category ID / 需求类别'),
        label: z.string().optional().describe('Label / 标签（多个以|分隔）'),
        parent_id: z.string().optional().describe('Parent story ID / 父需求ID'),
        templated_id: z.string().optional().describe('Template ID / 模板ID'),
        estimate: z.union([z.string(), z.number()]).optional().describe('DEPRECATED: Use "effort" instead. Will be remapped automatically for backward compatibility.'),
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
        // Backward compat: remap deprecated "estimate" to "effort"
        const compatArgs = { ...args as Record<string, unknown> };
        if (compatArgs.estimate !== undefined && compatArgs.effort === undefined) {
          compatArgs.effort = compatArgs.estimate;
        }

        const body: Record<string, unknown> = {
          workspace_id: args.workspace_id,
          name: args.name,
          ...pickDefined(compatArgs, STORY_FIELDS),
        };

        const data = await client.post<Record<string, unknown>>('/stories', body);
        const story = data ? Object.values(data)[0] : null;
        return toMcpText(buildOperationResponse({ tool: 'tapd_create_story', action: 'created', entityType: 'story', item: story, workspaceId: args.workspace_id }));
      } catch (error) {
        return toMcpError(buildErrorResponse({ tool: 'tapd_create_story', error, workspaceId: args.workspace_id, entityType: 'story' }));
      }
    }
  );

  server.registerTool(
    'tapd_update_story',
    {
      title: 'Update TAPD Story',
      description: 'Update an existing TAPD story. Only provided fields will be updated; omitted fields stay unchanged. Use tapd_get_story to verify before/after.',
      inputSchema: {
        workspace_id: z.string().describe('TAPD workspace/project ID / 项目ID'),
        story_id: z.string().describe('The story ID to update / 需求ID'),
        name: z.string().optional().describe('New story title / 标题'),
        description: z.string().optional().describe('New description / 详细描述 (HTML allowed)'),
        status: z.string().optional().describe('Status / 状态. Common: new, planning, planned, developing, testing, resolved, done, closed, reopened, rejected, draft. Values are workspace-configurable.'),
        v_status: z.string().optional().describe('Status (Chinese name) / 状态（中文名称）, e.g. "规划中", "开发中"'),
        owner: z.string().optional().describe('New owner/handler / 处理人'),
        priority: z.string().optional().describe('New priority / 优先级'),
        priority_label: z.string().optional().describe('New priority label / 优先级（推荐使用，支持自定义优先级）'),
        iteration_id: z.string().optional().describe('New iteration ID / 迭代ID'),
        begin: z.string().optional().describe('New begin date / 预计开始 (YYYY-MM-DD)'),
        due: z.string().optional().describe('New due date / 预计结束 (YYYY-MM-DD)'),
        size: z.string().optional().describe('Story size/scale / 规模'),
        category_id: z.string().optional().describe('New category ID / 需求分类'),
        effort: z.union([z.string(), z.number()]).optional().describe('New estimated effort / 预估工时 (work hours / person-days)'),
        effort_completed: z.string().optional().describe('Completed effort / 完成工时'),
        remain: z.number().optional().describe('Remaining effort / 剩余工时'),
        exceed: z.number().optional().describe('Exceeded effort / 超出工时'),
        developer: z.string().optional().describe('Developer / 开发人员'),
        cc: z.string().optional().describe('CC/Copy-to users / 抄送人'),
        current_user: z.string().optional().describe('Change author / 变更人'),
        version: z.string().optional().describe('Version / 版本'),
        module: z.string().optional().describe('Module / 模块'),
        test_focus: z.string().optional().describe('Test focus / 测试重点'),
        business_value: z.number().optional().describe('Business value / 业务价值'),
        source: z.string().optional().describe('Source / 来源'),
        type: z.string().optional().describe('Type / 类型'),
        release_id: z.string().optional().describe('Release plan ID / 发布计划'),
        label: z.string().optional().describe('Label / 标签（多个以|分隔）'),
        is_auto_close_task: z.string().optional().describe('Auto-close tasks / 自动关闭任务 (1=yes)'),
        estimate: z.union([z.string(), z.number()]).optional().describe('DEPRECATED: Use "effort" instead. Will be remapped automatically for backward compatibility.'),
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
        // Backward compat: remap deprecated "estimate" to "effort"
        const compatArgs = { ...args as Record<string, unknown> };
        if (compatArgs.estimate !== undefined && compatArgs.effort === undefined) {
          compatArgs.effort = compatArgs.estimate;
        }

        const body: Record<string, unknown> = {
          workspace_id: args.workspace_id,
          id: args.story_id,
          ...pickDefined(compatArgs, STORY_FIELDS),
        };

        const data = await client.post<Record<string, unknown>>('/stories', body);
        const story = data ? Object.values(data)[0] : null;
        return toMcpText(buildOperationResponse({ tool: 'tapd_update_story', action: 'updated', entityType: 'story', item: story, entityId: args.story_id, workspaceId: args.workspace_id }));
      } catch (error) {
        return toMcpError(buildErrorResponse({ tool: 'tapd_update_story', error, workspaceId: args.workspace_id, entityType: 'story', entityId: args.story_id }));
      }
    }
  );

  server.registerTool(
    'tapd_delete_story',
    {
      title: 'Delete TAPD Story',
      description: 'Delete a TAPD story (soft-delete via status=deleted). The story is moved to trash, not permanently erased.',
      inputSchema: {
        workspace_id: z.string().describe('TAPD workspace/project ID / 项目ID'),
        story_id: z.string().describe('The story ID to delete / 需求ID'),
      },
    },
    async (args) => {
      try {
        await client.post('/stories', {
          workspace_id: args.workspace_id,
          id: args.story_id,
          status: 'deleted',
        });
        return toMcpText(buildOperationResponse({ tool: 'tapd_delete_story', action: 'deleted', entityType: 'story', entityId: args.story_id, workspaceId: args.workspace_id }));
      } catch (error) {
        return toMcpError(buildErrorResponse({ tool: 'tapd_delete_story', error, workspaceId: args.workspace_id, entityType: 'story', entityId: args.story_id }));
      }
    }
  );

  server.registerTool(
    'tapd_batch_update_stories',
    {
      title: 'Batch Update TAPD Stories',
      description: 'Update multiple stories at once with the SAME field values (e.g. move all to one iteration, or change status for many). More efficient than calling tapd_update_story repeatedly. Use story_ids (comma-separated).',
      inputSchema: {
        workspace_id: z.string().describe('TAPD workspace/project ID / 项目ID'),
        story_ids: z.string().describe('Comma-separated story IDs / 需求ID列表, e.g. "123,456,789"'),
        status: z.string().optional().describe('New status / 状态. Common: new, planning, planned, developing, testing, resolved, done, closed, reopened, rejected, draft.'),
        owner: z.string().optional().describe('New owner/handler / 处理人'),
        priority: z.string().optional().describe('New priority / 优先级'),
        iteration_id: z.string().optional().describe('New iteration ID / 迭代ID'),
      },
    },
    async (args) => {
      try {
        const ids = args.story_ids.split(',').map(id => id.trim());
        const fields = pickDefined(args as Record<string, unknown>, ['status', 'owner', 'priority', 'priority_label', 'iteration_id']);

        const workitems = ids.map(id => ({ id, ...fields }));

        const body = {
          workspace_id: args.workspace_id,
          workitems,
        };
        await client.post('/stories/batch_update_story', body);
        return toMcpText(buildOperationResponse({ tool: 'tapd_batch_update_stories', action: 'updated', entityType: 'story', workspaceId: args.workspace_id }));
      } catch (error) {
        return toMcpError(buildErrorResponse({ tool: 'tapd_batch_update_stories', error, workspaceId: args.workspace_id, entityType: 'story' }));
      }
    }
  );
}
