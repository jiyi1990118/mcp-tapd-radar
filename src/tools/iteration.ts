import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { TapdApiClient } from '../api/TapdApiClient.js';
import { QueryBuilder } from '../api/QueryBuilder.js';
import { convertDataToArray } from '../utils/helpers.js';
import { buildDetailResponse, buildErrorResponse, buildListResponse, toMcpError, toMcpText } from '../utils/response.js';

export function registerIterationTools(server: McpServer, client: TapdApiClient): void {
  server.registerTool(
    'tapd_list_iterations',
    {
      title: 'List TAPD Iterations',
      description: 'List iterations (sprints) in a TAPD workspace. Returns iteration id, name, status, start/end dates. Use tapd_get_iteration for a single iteration detail by ID.',
      inputSchema: {
        workspace_id: z.string().describe('TAPD workspace/project ID / 项目ID (from tapd_list_workspaces or TAPD URL, e.g. 48801209)'),
        status: z.string().optional().describe('Filter by status / 按状态过滤: open(进行中)|done(已完成)'),
        name: z.string().optional().describe('Fuzzy search by iteration name / 按迭代名称模糊搜索'),
        created: z.string().optional().describe('Created time filter / 创建时间. Format: ">2026-01-01", "<2026-06-30", or "2026-01-01~2026-06-30"'),
        modified: z.string().optional().describe('Modified time filter / 最后修改时间. Format: ">2026-01-01", "<2026-06-30", or "2026-01-01~2026-06-30"'),
        limit: z.number().optional().describe('Results per page / 每页数量（默认30，最大200）'),
        page: z.number().optional().describe('Page number / 页码（从1开始）'),
      },
    },
    async (args) => {
      try {
        const qb = new QueryBuilder()
          .add('workspace_id', args.workspace_id)
          .addEnumOr('status', args.status)
          .addLike('name', args.name)
          .addTimeRange('created', args.created)
          .addTimeRange('modified', args.modified)
          .addPagination(args.limit, args.page);

        const data = await client.get<Record<string, unknown>>('/iterations', Object.fromEntries(new URLSearchParams(qb.build())));
        return toMcpText(buildListResponse({
          tool: 'tapd_list_iterations',
          entityType: 'iteration',
          items: convertDataToArray(data),
          workspaceId: args.workspace_id,
          filters: { status: args.status, name: args.name, created: args.created, modified: args.modified },
          limit: args.limit,
          page: args.page,
        }));
      } catch (error) {
        return toMcpError(buildErrorResponse({ tool: 'tapd_list_iterations', error, workspaceId: args.workspace_id, entityType: 'iteration' }));
      }
    }
  );

  server.registerTool(
    'tapd_get_iteration',
    {
      title: 'Get TAPD Iteration Detail',
      description: 'Get detailed information about a specific TAPD iteration by its ID. Use tapd_list_iterations first to find the iteration_id.',
      inputSchema: {
        workspace_id: z.string().describe('TAPD workspace/project ID / 项目ID'),
        iteration_id: z.string().describe('The iteration ID to retrieve / 迭代ID (from tapd_list_iterations "id" field)'),
      },
    },
    async (args) => {
      try {
        const params: Record<string, string> = { workspace_id: args.workspace_id, id: args.iteration_id };
        const data = await client.get<Record<string, unknown>>('/iterations', params);
        const iteration = data ? Object.values(data)[0] : null;
        if (!iteration) return toMcpError(buildErrorResponse({ tool: 'tapd_get_iteration', error: new Error(`Iteration ${args.iteration_id} not found`), workspaceId: args.workspace_id, entityType: 'iteration', entityId: args.iteration_id }));
        return toMcpText(buildDetailResponse({ tool: 'tapd_get_iteration', entityType: 'iteration', item: iteration, workspaceId: args.workspace_id, entityId: args.iteration_id }));
      } catch (error) {
        return toMcpError(buildErrorResponse({ tool: 'tapd_get_iteration', error, workspaceId: args.workspace_id, entityType: 'iteration', entityId: args.iteration_id }));
      }
    }
  );

  server.registerTool(
    'tapd_set_iteration_lock',
    {
      title: 'Lock or Unlock TAPD Iteration',
      description: 'Lock an iteration (makes its stories/bugs/tasks read-only, e.g. a frozen sprint) or unlock it. Set locked=true to lock, locked=false to unlock. Lock/unlock require special app permissions; a 403 means the app lacks them.',
      inputSchema: {
        workspace_id: z.string().describe('TAPD workspace/project ID / 项目ID'),
        iteration_id: z.string().describe('The iteration ID to lock or unlock / 迭代ID'),
        locked: z.boolean().describe('true = lock (make read-only), false = unlock (allow modifications)'),
      },
    },
    async (args) => {
      const action = args.locked ? 'lock' : 'unlock';
      const summary = args.locked
        ? `Iteration ${args.iteration_id} locked. Stories, bugs, and tasks in this iteration are now read-only.`
        : `Iteration ${args.iteration_id} unlocked. Stories, bugs, and tasks can now be modified.`;
      try {
        await client.post(`/iterations/${action}`, {
          workspace_id: args.workspace_id,
          id: args.iteration_id,
        });
        return toMcpText({
          ok: true,
          tool: 'tapd_set_iteration_lock',
          summary,
          data: { iteration_id: args.iteration_id, locked: args.locked },
        });
      } catch (error) {
        return toMcpError(buildErrorResponse({ tool: 'tapd_set_iteration_lock', error, workspaceId: args.workspace_id, entityType: 'iteration', entityId: args.iteration_id }));
      }
    }
  );
}
