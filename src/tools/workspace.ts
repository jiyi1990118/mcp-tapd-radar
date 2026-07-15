import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { TapdApiClient } from '../api/TapdApiClient.js';
import { QueryBuilder } from '../api/QueryBuilder.js';
import { convertDataToArray } from '../utils/helpers.js';
import { buildDetailResponse, buildErrorResponse, buildListResponse, toMcpError, toMcpText } from '../utils/response.js';

export function registerWorkspaceTools(server: McpServer, client: TapdApiClient): void {
  server.registerTool(
    'tapd_list_workspaces',
    {
      title: 'List TAPD Workspaces',
      description: 'List all TAPD workspaces (projects) the authenticated app can access. The "id" field in the result IS the workspace_id required by most other tools. No workspace_id needed here. Use this first if you do not know the workspace ID.',
      inputSchema: {
        name: z.string().optional().describe('Fuzzy search by workspace name / 按项目名称模糊搜索'),
        status: z.string().optional().describe('Filter by workspace status / 按状态过滤'),
        limit: z.number().optional().describe('Results per page / 每页数量（默认30，最大200）'),
        page: z.number().optional().describe('Page number / 页码（从1开始）'),
      },
    },
    async (args) => {
      try {
        const qb = new QueryBuilder()
          .addLike('name', args.name)
          .add('status', args.status)
          .addPagination(args.limit, args.page);

        const data = await client.get<Record<string, unknown>>('/workspaces', Object.fromEntries(new URLSearchParams(qb.build())));
        return toMcpText(buildListResponse({
          tool: 'tapd_list_workspaces',
          entityType: 'workspace',
          items: convertDataToArray(data),
          filters: { name: args.name, status: args.status },
          limit: args.limit,
          page: args.page,
        }));
      } catch (error) {
        return toMcpError(buildErrorResponse({ tool: 'tapd_list_workspaces', error, entityType: 'workspace' }));
      }
    }
  );

  server.registerTool(
    'tapd_get_workspace',
    {
      title: 'Get TAPD Workspace Detail',
      description: 'Get detailed information about a specific TAPD workspace by its ID.',
      inputSchema: {
        workspace_id: z.string().describe('TAPD workspace/project ID / 项目ID (from tapd_list_workspaces "id" field)'),
      },
    },
    async (args) => {
      try {
        const data = await client.get<Record<string, unknown>>('/workspaces', { workspace_id: args.workspace_id });
        const workspace = data ? Object.values(data)[0] : null;
        if (!workspace) return toMcpError(buildErrorResponse({ tool: 'tapd_get_workspace', error: new Error(`Workspace ${args.workspace_id} not found`), workspaceId: args.workspace_id, entityType: 'workspace', entityId: args.workspace_id }));
        return toMcpText(buildDetailResponse({ tool: 'tapd_get_workspace', entityType: 'workspace', item: workspace, workspaceId: args.workspace_id, entityId: args.workspace_id }));
      } catch (error) {
        return toMcpError(buildErrorResponse({ tool: 'tapd_get_workspace', error, workspaceId: args.workspace_id, entityType: 'workspace', entityId: args.workspace_id }));
      }
    }
  );
}
