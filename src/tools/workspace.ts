import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { TapdApiClient } from '../api/TapdApiClient.js';
import { QueryBuilder } from '../api/QueryBuilder.js';
import { convertDataToArray } from '../utils/helpers.js';

export function registerWorkspaceTools(server: McpServer, client: TapdApiClient): void {
  server.registerTool(
    'tapd_list_workspaces',
    {
      title: 'List TAPD Workspaces',
      description: 'List all accessible TAPD workspaces (projects). Returns an array of workspace objects.',
      inputSchema: {
        name: z.string().optional().describe('Fuzzy search by workspace name'),
        status: z.string().optional().describe('Filter by workspace status'),
        limit: z.number().optional().describe('Results per page (default 30, max 200)'),
        page: z.number().optional().describe('Page number (starts from 1)'),
      },
    },
    async (args) => {
      try {
        const qb = new QueryBuilder()
          .addLike('name', args.name)
          .add('status', args.status)
          .addPagination(args.limit, args.page);

        const data = await client.get<Record<string, unknown>>('/workspaces', Object.fromEntries(new URLSearchParams(qb.build())));
        return { content: [{ type: 'text', text: JSON.stringify(convertDataToArray(data), null, 2) }] };
      } catch (error) {
        return { content: [{ type: 'text', text: `Error: ${(error as Error).message}` }], isError: true };
      }
    }
  );

  server.registerTool(
    'tapd_get_workspace',
    {
      title: 'Get TAPD Workspace Detail',
      description: 'Get detailed information about a specific TAPD workspace by its ID.',
      inputSchema: {
        workspace_id: z.string().describe('TAPD workspace/project ID'),
      },
    },
    async (args) => {
      try {
        const data = await client.get<Record<string, unknown>>('/workspaces', { workspace_id: args.workspace_id });
        const workspace = data ? Object.values(data)[0] : null;
        if (!workspace) return { content: [{ type: 'text', text: `Workspace ${args.workspace_id} not found` }], isError: true };
        return { content: [{ type: 'text', text: JSON.stringify(workspace, null, 2) }] };
      } catch (error) {
        return { content: [{ type: 'text', text: `Error: ${(error as Error).message}` }], isError: true };
      }
    }
  );
}
