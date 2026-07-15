import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { TapdApiClient } from '../api/TapdApiClient.js';
import { convertDataToArray } from '../utils/helpers.js';
import { buildDetailResponse, buildErrorResponse, buildListResponse, toMcpError, toMcpText } from '../utils/response.js';

export function registerUserTools(server: McpServer, client: TapdApiClient): void {
  server.registerTool(
    'tapd_list_users',
    {
      title: 'List TAPD Users',
      description: 'List users in a TAPD workspace. Returns user id, name, nick, email, status. Use "name" for fuzzy search by display name. Use tapd_get_user to fetch a single user by ID.',
      inputSchema: {
        workspace_id: z.string().describe('TAPD workspace/project ID / 项目ID'),
        name: z.string().optional().describe('Fuzzy search by user name or nick / 按姓名或昵称模糊搜索'),
        status: z.string().optional().describe('Filter by user status / 按状态过滤'),
        limit: z.number().optional().describe('Results per page / 每页数量（默认30，最大200）'),
        page: z.number().optional().describe('Page number / 页码（从1开始）'),
      },
    },
    async (args) => {
      try {
        const params: Record<string, string> = { workspace_id: args.workspace_id };
        if (args.name) params.name = args.name;
        if (args.status) params.status = args.status;
        if (args.limit) params.limit = String(args.limit);
        if (args.page) params.page = String(args.page);

        const data = await client.get<Record<string, unknown>>('/workspaces/users', params);
        return toMcpText(buildListResponse({
          tool: 'tapd_list_users',
          entityType: 'user',
          items: convertDataToArray(data),
          workspaceId: args.workspace_id,
          filters: { name: args.name, status: args.status },
          limit: args.limit,
          page: args.page,
        }));
      } catch (error) {
        return toMcpError(buildErrorResponse({ tool: 'tapd_list_users', error, workspaceId: args.workspace_id, entityType: 'user' }));
      }
    }
  );

  server.registerTool(
    'tapd_get_user',
    {
      title: 'Get TAPD User Detail',
      description: 'Get detailed information about a specific TAPD user by user ID. Use tapd_list_users first to find the user_id.',
      inputSchema: {
        workspace_id: z.string().describe('TAPD workspace/project ID / 项目ID'),
        user_id: z.string().describe('The user ID to retrieve / 用户ID (from tapd_list_users "id" field)'),
      },
    },
    async (args) => {
      try {
        const data = await client.get<Record<string, unknown>>('/workspaces/users', {
          workspace_id: args.workspace_id,
          id: args.user_id,
        });
        const user = data ? Object.values(data)[0] : null;
        if (!user) return toMcpError(buildErrorResponse({ tool: 'tapd_get_user', error: new Error(`User ${args.user_id} not found`), workspaceId: args.workspace_id, entityType: 'user', entityId: args.user_id }));
        return toMcpText(buildDetailResponse({ tool: 'tapd_get_user', entityType: 'user', item: user, workspaceId: args.workspace_id, entityId: args.user_id }));
      } catch (error) {
        return toMcpError(buildErrorResponse({ tool: 'tapd_get_user', error, workspaceId: args.workspace_id, entityType: 'user', entityId: args.user_id }));
      }
    }
  );
}
