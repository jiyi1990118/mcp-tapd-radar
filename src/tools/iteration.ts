import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { TapdApiClient } from '../api/TapdApiClient.js';
import { QueryBuilder } from '../api/QueryBuilder.js';
import { convertDataToArray } from '../utils/helpers.js';

export function registerIterationTools(server: McpServer, client: TapdApiClient): void {
  server.registerTool(
    'tapd_list_iterations',
    {
      title: 'List TAPD Iterations',
      description: 'List iterations (sprints) in a TAPD workspace. Returns an array of iteration objects.',
      inputSchema: {
        workspace_id: z.string().describe('TAPD workspace/project ID'),
        status: z.string().optional().describe('Filter by status: open|done'),
        name: z.string().optional().describe('Fuzzy search by iteration name'),
        created: z.string().optional().describe('Filter by created time. Supports >date, <date, date~date'),
        modified: z.string().optional().describe('Filter by modified time. Supports >date, <date, date~date'),
        limit: z.number().optional().describe('Results per page (default 30, max 200)'),
        page: z.number().optional().describe('Page number (starts from 1)'),
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
        return { content: [{ type: 'text', text: JSON.stringify(convertDataToArray(data), null, 2) }] };
      } catch (error) {
        return { content: [{ type: 'text', text: `Error: ${(error as Error).message}` }], isError: true };
      }
    }
  );

  server.registerTool(
    'tapd_get_iteration',
    {
      title: 'Get TAPD Iteration Detail',
      description: 'Get detailed information about a specific TAPD iteration by its ID.',
      inputSchema: {
        workspace_id: z.string().describe('TAPD workspace/project ID'),
        iteration_id: z.string().describe('The iteration ID to retrieve'),
      },
    },
    async (args) => {
      try {
        const params: Record<string, string> = { workspace_id: args.workspace_id, id: args.iteration_id };
        const data = await client.get<Record<string, unknown>>('/iterations', params);
        const iteration = data ? Object.values(data)[0] : null;
        if (!iteration) return { content: [{ type: 'text', text: `Iteration ${args.iteration_id} not found` }], isError: true };
        return { content: [{ type: 'text', text: JSON.stringify(iteration, null, 2) }] };
      } catch (error) {
        return { content: [{ type: 'text', text: `Error: ${(error as Error).message}` }], isError: true };
      }
    }
  );
}
