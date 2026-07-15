import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { TapdApiClient } from '../api/TapdApiClient.js';
import { QueryBuilder } from '../api/QueryBuilder.js';
import { pickDefined } from '../utils/helpers.js';
import { buildCountResponse, buildErrorResponse, toMcpError, toMcpText } from '../utils/response.js';

type WorkitemEntity = 'story' | 'bug' | 'task';

const ENTITY_ENDPOINTS: Record<WorkitemEntity, string> = {
  story: '/stories/count',
  bug: '/bugs/count',
  task: '/tasks/count',
};

export function registerWorkitemTools(server: McpServer, client: TapdApiClient): void {
  server.registerTool(
    'tapd_count_workitems',
    {
      title: 'Count TAPD Workitems',
      description: 'Count the NUMBER of stories, bugs, or tasks matching filters (returns a count only, NOT a list). Use tapd_list_stories/bugs/tasks when you need the actual items. Set entity_type to choose the target. Filter params (severity/reporter -> bug, story_id -> task) only apply to specific entities.',
      inputSchema: {
        workspace_id: z.string().describe('TAPD workspace/project ID / 项目ID (from tapd_list_workspaces or TAPD URL, e.g. 48801209)'),
        entity_type: z.enum(['story', 'bug', 'task']).describe('Entity type to count / 计数对象: story|bug|task'),
        id: z.string().optional().describe('Filter by ID / ID (supports multi-ID comma-separated)'),
        status: z.string().optional().describe('Filter by status / 状态 (supports OR with |)'),
        priority: z.string().optional().describe('Filter by priority / 优先级 (numeric)'),
        priority_label: z.string().optional().describe('Filter by priority label / 优先级（推荐）'),
        owner: z.string().optional().describe('Filter by owner/handler / 处理人 (story/task). For bugs use current_owner.'),
        current_owner: z.string().optional().describe('Filter by current handler / 当前处理人 (bug only)'),
        reporter: z.string().optional().describe('Filter by reporter / 报告人 (bug only)'),
        creator: z.string().optional().describe('Filter by creator / 创建人'),
        developer: z.string().optional().describe('Filter by developer / 开发人员 (story only)'),
        severity: z.string().optional().describe('Filter by severity / 严重程度 (bug only): fatal|serious|normal|slight|suggest'),
        iteration_id: z.string().optional().describe('Filter by iteration ID / 迭代ID'),
        category_id: z.string().optional().describe('Filter by category ID / 分类ID (story/task)'),
        workitem_type_id: z.string().optional().describe('Filter by work item type ID / 需求类别 (story only)'),
        label: z.string().optional().describe('Filter by label / 标签'),
        parent_id: z.string().optional().describe('Filter by parent ID / 父需求ID (story only)'),
        story_id: z.string().optional().describe('Filter by related story ID / 关联需求ID (task only)'),
        module: z.string().optional().describe('Filter by module / 模块 (bug only)'),
        created: z.string().optional().describe('Created time filter / 创建时间. Format: ">2026-01-01", "<2026-06-30", or "2026-01-01~2026-06-30"'),
        modified: z.string().optional().describe('Modified time filter / 最后修改时间. Format: ">2026-01-01", "<2026-06-30", or "2026-01-01~2026-06-30"'),
        completed: z.string().optional().describe('Completed time filter / 完成时间 (story/task). Format: ">2026-01-01", "<2026-06-30", or "2026-01-01~2026-06-30"'),
        resolved: z.string().optional().describe('Resolved time filter / 解决时间 (bug only). Format: ">2026-01-01", "<2026-06-30", or "2026-01-01~2026-06-30"'),
        closed: z.string().optional().describe('Closed time filter / 关闭时间 (bug only). Format: ">2026-01-01", "<2026-06-30", or "2026-01-01~2026-06-30"'),
      },
    },
    async (args) => {
      try {
        const entity = args.entity_type as WorkitemEntity;
        const endpoint = ENTITY_ENDPOINTS[entity];

        const qb = new QueryBuilder()
          .add('workspace_id', args.workspace_id)
          .add('id', args.id)
          .addEnumOr('status', args.status)
          .addEnumOr('severity', args.severity)
          .addEnumOr('priority', args.priority)
          .add('priority_label', args.priority_label)
          .add('owner', args.owner)
          .add('current_owner', args.current_owner)
          .add('reporter', args.reporter)
          .add('creator', args.creator)
          .add('developer', args.developer)
          .add('iteration_id', args.iteration_id)
          .add('category_id', args.category_id)
          .addEnumOr('workitem_type_id', args.workitem_type_id)
          .addEnumOr('label', args.label)
          .add('parent_id', args.parent_id)
          .add('story_id', args.story_id)
          .add('module', args.module)
          .addTimeRange('created', args.created)
          .addTimeRange('modified', args.modified)
          .addTimeRange('completed', args.completed)
          .addTimeRange('resolved', args.resolved)
          .addTimeRange('closed', args.closed);

        const data = await client.get<{ count: number }>(endpoint, Object.fromEntries(new URLSearchParams(qb.build())));
        return toMcpText(buildCountResponse({
          tool: 'tapd_count_workitems',
          entityType: entity,
          count: data,
          workspaceId: args.workspace_id,
          filters: pickDefined(args as Record<string, unknown>, [
            'entity_type', 'id', 'status', 'severity', 'priority', 'priority_label',
            'owner', 'current_owner', 'reporter', 'creator', 'developer',
            'iteration_id', 'category_id', 'workitem_type_id', 'label', 'parent_id',
            'story_id', 'module', 'created', 'modified', 'completed', 'resolved', 'closed',
          ]),
        }));
      } catch (error) {
        return toMcpError(buildErrorResponse({ tool: 'tapd_count_workitems', error, workspaceId: args.workspace_id, entityType: args.entity_type }));
      }
    }
  );
}
