import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { TapdApiClient } from '../api/TapdApiClient.js';
import { QueryBuilder } from '../api/QueryBuilder.js';
import { convertDataToArray, pickDefined } from '../utils/helpers.js';

const BUG_FIELDS = [
  'title', 'description', 'severity', 'priority', 'current_owner', 'status',
  'deadline', 'resolution', 'platform', 'os', 'source', 'module', 'iteration_id',
];

export function registerBugTools(server: McpServer, client: TapdApiClient): void {
  server.registerTool(
    'tapd_list_bugs',
    {
      title: 'List TAPD Bugs',
      description: 'List bugs (defects) in a TAPD workspace with filtering and pagination. Returns an array of bug objects.',
      inputSchema: {
        workspace_id: z.string().describe('TAPD workspace/project ID'),
        status: z.string().optional().describe('Filter by status, supports OR with |, e.g. "new|in_progress"'),
        severity: z.string().optional().describe('Filter by severity: fatal|serious|normal|slight|suggest'),
        priority: z.string().optional().describe('Filter by priority: urgent|high|medium|low|insignificant'),
        current_owner: z.string().optional().describe('Filter by current handler'),
        reporter: z.string().optional().describe('Filter by reporter'),
        title: z.string().optional().describe('Fuzzy search by bug title'),
        created: z.string().optional().describe('Filter by created time. Supports >date, <date, date~date'),
        modified: z.string().optional().describe('Filter by modified time. Supports >date, <date, date~date'),
        limit: z.number().optional().describe('Results per page (default 30, max 200)'),
        page: z.number().optional().describe('Page number (starts from 1)'),
        fields: z.string().optional().describe('Comma-separated list of fields to return'),
      },
    },
    async (args) => {
      try {
        const qb = new QueryBuilder()
          .add('workspace_id', args.workspace_id)
          .addEnumOr('status', args.status)
          .addEnumOr('severity', args.severity)
          .addEnumOr('priority', args.priority)
          .add('current_owner', args.current_owner)
          .add('reporter', args.reporter)
          .addLike('title', args.title)
          .addTimeRange('created', args.created)
          .addTimeRange('modified', args.modified)
          .addPagination(args.limit, args.page);

        if (args.fields) qb.add('fields', args.fields);

        const data = await client.get<Record<string, unknown>>('/bugs', Object.fromEntries(new URLSearchParams(qb.build())));
        return { content: [{ type: 'text', text: JSON.stringify(convertDataToArray(data), null, 2) }] };
      } catch (error) {
        return { content: [{ type: 'text', text: `Error: ${(error as Error).message}` }], isError: true };
      }
    }
  );

  server.registerTool(
    'tapd_get_bug',
    {
      title: 'Get TAPD Bug Detail',
      description: 'Get detailed information about a specific TAPD bug by its ID.',
      inputSchema: {
        workspace_id: z.string().describe('TAPD workspace/project ID'),
        bug_id: z.string().describe('The bug ID to retrieve'),
        fields: z.string().optional().describe('Comma-separated list of fields to return'),
      },
    },
    async (args) => {
      try {
        const params: Record<string, string> = { workspace_id: args.workspace_id, id: args.bug_id };
        if (args.fields) params.fields = args.fields;

        const data = await client.get<Record<string, unknown>>('/bugs', params);
        const bug = data ? Object.values(data)[0] : null;
        if (!bug) return { content: [{ type: 'text', text: `Bug ${args.bug_id} not found` }], isError: true };
        return { content: [{ type: 'text', text: JSON.stringify(bug, null, 2) }] };
      } catch (error) {
        return { content: [{ type: 'text', text: `Error: ${(error as Error).message}` }], isError: true };
      }
    }
  );

  server.registerTool(
    'tapd_create_bug',
    {
      title: 'Create TAPD Bug',
      description: 'Create a new bug (defect) in a TAPD workspace.',
      inputSchema: {
        workspace_id: z.string().describe('TAPD workspace/project ID'),
        title: z.string().describe('Bug title (required)'),
        description: z.string().optional().describe('Bug description with steps to reproduce'),
        severity: z.string().optional().describe('Severity: fatal|serious|normal|slight|suggest'),
        priority: z.string().optional().describe('Priority: urgent|high|medium|low|insignificant'),
        current_owner: z.string().optional().describe('Current handler'),
        status: z.string().optional().describe('Initial status (default: new)'),
        deadline: z.string().optional().describe('Deadline date (YYYY-MM-DD)'),
        platform: z.string().optional().describe('Platform information'),
        os: z.string().optional().describe('Operating system'),
        source: z.string().optional().describe('Bug source'),
        module: z.string().optional().describe('Module name'),
        iteration_id: z.string().optional().describe('Iteration ID'),
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
        return { content: [{ type: 'text', text: JSON.stringify(bug, null, 2) }] };
      } catch (error) {
        return { content: [{ type: 'text', text: `Error: ${(error as Error).message}` }], isError: true };
      }
    }
  );

  server.registerTool(
    'tapd_update_bug',
    {
      title: 'Update TAPD Bug',
      description: 'Update an existing TAPD bug. Only provided fields will be updated.',
      inputSchema: {
        workspace_id: z.string().describe('TAPD workspace/project ID'),
        bug_id: z.string().describe('The bug ID to update'),
        title: z.string().optional().describe('New bug title'),
        description: z.string().optional().describe('New description'),
        severity: z.string().optional().describe('New severity'),
        priority: z.string().optional().describe('New priority'),
        current_owner: z.string().optional().describe('New handler'),
        status: z.string().optional().describe('New status'),
        deadline: z.string().optional().describe('New deadline'),
        resolution: z.string().optional().describe('Resolution'),
        platform: z.string().optional().describe('New platform'),
        os: z.string().optional().describe('New OS'),
        source: z.string().optional().describe('New source'),
        module: z.string().optional().describe('New module'),
        iteration_id: z.string().optional().describe('New iteration ID'),
      },
    },
    async (args) => {
      try {
        const body: Record<string, unknown> = {
          workspace_id: args.workspace_id,
          id: args.bug_id,
          ...pickDefined(args as Record<string, unknown>, BUG_FIELDS),
        };

        const data = await client.post<Record<string, unknown>>('/bugs/changes', body);
        const bug = data ? Object.values(data)[0] : null;
        return { content: [{ type: 'text', text: JSON.stringify(bug, null, 2) }] };
      } catch (error) {
        return { content: [{ type: 'text', text: `Error: ${(error as Error).message}` }], isError: true };
      }
    }
  );

  server.registerTool(
    'tapd_count_bugs',
    {
      title: 'Count TAPD Bugs',
      description: 'Count the number of bugs matching the given filters in a TAPD workspace.',
      inputSchema: {
        workspace_id: z.string().describe('TAPD workspace/project ID'),
        status: z.string().optional().describe('Filter by status'),
        severity: z.string().optional().describe('Filter by severity'),
        priority: z.string().optional().describe('Filter by priority'),
        current_owner: z.string().optional().describe('Filter by current handler'),
        created: z.string().optional().describe('Filter by created time range'),
        modified: z.string().optional().describe('Filter by modified time range'),
      },
    },
    async (args) => {
      try {
        const qb = new QueryBuilder()
          .add('workspace_id', args.workspace_id)
          .addEnumOr('status', args.status)
          .addEnumOr('severity', args.severity)
          .addEnumOr('priority', args.priority)
          .add('current_owner', args.current_owner)
          .addTimeRange('created', args.created)
          .addTimeRange('modified', args.modified);

        const data = await client.get<{ count: number }>('/bugs/count', Object.fromEntries(new URLSearchParams(qb.build())));
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      } catch (error) {
        return { content: [{ type: 'text', text: `Error: ${(error as Error).message}` }], isError: true };
      }
    }
  );

  server.registerTool(
    'tapd_delete_bug',
    {
      title: 'Delete TAPD Bug',
      description: 'Delete a TAPD bug by its ID.',
      inputSchema: {
        workspace_id: z.string().describe('TAPD workspace/project ID'),
        bug_id: z.string().describe('The bug ID to delete'),
      },
    },
    async (args) => {
      try {
        await client.post('/bugs/changes', {
          workspace_id: args.workspace_id,
          id: args.bug_id,
          status: 'deleted',
        });
        return { content: [{ type: 'text', text: `Bug ${args.bug_id} deleted successfully` }] };
      } catch (error) {
        return { content: [{ type: 'text', text: `Error: ${(error as Error).message}` }], isError: true };
      }
    }
  );
}
