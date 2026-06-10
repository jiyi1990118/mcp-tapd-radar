import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { TapdApiClient } from '../api/TapdApiClient.js';
import { QueryBuilder } from '../api/QueryBuilder.js';
import { convertDataToArray, pickDefined } from '../utils/helpers.js';
import { buildTapdDetailContent, getTapdClientAuth } from '../utils/tapdImages.js';

const TASK_FIELDS = [
  'name', 'description', 'status', 'owner', 'priority', 'iteration_id',
  'begin', 'due', 'category_id',
];

export function registerTaskTools(server: McpServer, client: TapdApiClient): void {
  server.registerTool(
    'tapd_list_tasks',
    {
      title: 'List TAPD Tasks',
      description: 'List tasks in a TAPD workspace with filtering and pagination. Returns an array of task objects.',
      inputSchema: {
        workspace_id: z.string().describe('TAPD workspace/project ID'),
        status: z.string().optional().describe('Filter by status, supports OR with |, e.g. "new|in_progress"'),
        owner: z.string().optional().describe('Filter by owner (handler)'),
        creator: z.string().optional().describe('Filter by creator'),
        name: z.string().optional().describe('Fuzzy search by task name'),
        priority: z.string().optional().describe('Filter by priority'),
        iteration_id: z.string().optional().describe('Filter by iteration ID'),
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
          .add('owner', args.owner)
          .add('creator', args.creator)
          .addLike('name', args.name)
          .add('priority', args.priority)
          .add('iteration_id', args.iteration_id)
          .addTimeRange('created', args.created)
          .addTimeRange('modified', args.modified)
          .addPagination(args.limit, args.page);

        if (args.fields) qb.add('fields', args.fields);

        const data = await client.get<Record<string, unknown>>('/tasks', Object.fromEntries(new URLSearchParams(qb.build())));
        return { content: [{ type: 'text', text: JSON.stringify(convertDataToArray(data), null, 2) }] };
      } catch (error) {
        return { content: [{ type: 'text', text: `Error: ${(error as Error).message}` }], isError: true };
      }
    }
  );

  server.registerTool(
    'tapd_get_task',
    {
      title: 'Get TAPD Task Detail',
      description: 'Get detailed information about a specific TAPD task by its ID.',
      inputSchema: {
        workspace_id: z.string().describe('TAPD workspace/project ID'),
        task_id: z.string().describe('The task ID to retrieve'),
        fields: z.string().optional().describe('Comma-separated list of fields to return'),
      },
    },
    async (args) => {
      try {
        const params: Record<string, string> = { workspace_id: args.workspace_id, id: args.task_id };
        if (args.fields) params.fields = args.fields;

        const data = await client.get<Record<string, unknown>>('/tasks', params);
        const task = data ? Object.values(data)[0] : null;
        if (!task) return { content: [{ type: 'text', text: `Task ${args.task_id} not found` }], isError: true };
        return { content: await buildTapdDetailContent(task, getTapdClientAuth(client)) };
      } catch (error) {
        return { content: [{ type: 'text', text: `Error: ${(error as Error).message}` }], isError: true };
      }
    }
  );

  server.registerTool(
    'tapd_create_task',
    {
      title: 'Create TAPD Task',
      description: 'Create a new task in a TAPD workspace.',
      inputSchema: {
        workspace_id: z.string().describe('TAPD workspace/project ID'),
        name: z.string().describe('Task name (required)'),
        description: z.string().optional().describe('Task description'),
        status: z.string().optional().describe('Initial status (default: new)'),
        owner: z.string().optional().describe('Handler/owner of the task'),
        priority: z.string().optional().describe('Priority level'),
        iteration_id: z.string().optional().describe('Iteration to assign the task to'),
        begin: z.string().optional().describe('Start date (YYYY-MM-DD)'),
        due: z.string().optional().describe('Due date (YYYY-MM-DD)'),
        category_id: z.string().optional().describe('Category ID'),
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
        return { content: [{ type: 'text', text: JSON.stringify(task, null, 2) }] };
      } catch (error) {
        return { content: [{ type: 'text', text: `Error: ${(error as Error).message}` }], isError: true };
      }
    }
  );

  server.registerTool(
    'tapd_update_task',
    {
      title: 'Update TAPD Task',
      description: 'Update an existing TAPD task. Only provided fields will be updated.',
      inputSchema: {
        workspace_id: z.string().describe('TAPD workspace/project ID'),
        task_id: z.string().describe('The task ID to update'),
        name: z.string().optional().describe('New task name'),
        description: z.string().optional().describe('New description'),
        status: z.string().optional().describe('New status'),
        owner: z.string().optional().describe('New owner/handler'),
        priority: z.string().optional().describe('New priority'),
        iteration_id: z.string().optional().describe('New iteration ID'),
        begin: z.string().optional().describe('New start date'),
        due: z.string().optional().describe('New due date'),
        category_id: z.string().optional().describe('New category ID'),
      },
    },
    async (args) => {
      try {
        const body: Record<string, unknown> = {
          workspace_id: args.workspace_id,
          id: args.task_id,
          ...pickDefined(args as Record<string, unknown>, TASK_FIELDS),
        };

        const data = await client.post<Record<string, unknown>>('/tasks/changes', body);
        const task = data ? Object.values(data)[0] : null;
        return { content: [{ type: 'text', text: JSON.stringify(task, null, 2) }] };
      } catch (error) {
        return { content: [{ type: 'text', text: `Error: ${(error as Error).message}` }], isError: true };
      }
    }
  );

  server.registerTool(
    'tapd_count_tasks',
    {
      title: 'Count TAPD Tasks',
      description: 'Count the number of tasks matching the given filters in a TAPD workspace.',
      inputSchema: {
        workspace_id: z.string().describe('TAPD workspace/project ID'),
        status: z.string().optional().describe('Filter by status'),
        owner: z.string().optional().describe('Filter by owner'),
        creator: z.string().optional().describe('Filter by creator'),
        priority: z.string().optional().describe('Filter by priority'),
        iteration_id: z.string().optional().describe('Filter by iteration ID'),
        created: z.string().optional().describe('Filter by created time range'),
        modified: z.string().optional().describe('Filter by modified time range'),
      },
    },
    async (args) => {
      try {
        const qb = new QueryBuilder()
          .add('workspace_id', args.workspace_id)
          .addEnumOr('status', args.status)
          .add('owner', args.owner)
          .add('creator', args.creator)
          .add('priority', args.priority)
          .add('iteration_id', args.iteration_id)
          .addTimeRange('created', args.created)
          .addTimeRange('modified', args.modified);

        const data = await client.get<{ count: number }>('/tasks/count', Object.fromEntries(new URLSearchParams(qb.build())));
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      } catch (error) {
        return { content: [{ type: 'text', text: `Error: ${(error as Error).message}` }], isError: true };
      }
    }
  );

  server.registerTool(
    'tapd_delete_task',
    {
      title: 'Delete TAPD Task',
      description: 'Delete a TAPD task by its ID.',
      inputSchema: {
        workspace_id: z.string().describe('TAPD workspace/project ID'),
        task_id: z.string().describe('The task ID to delete'),
      },
    },
    async (args) => {
      try {
        await client.post('/tasks/changes', {
          workspace_id: args.workspace_id,
          id: args.task_id,
          status: 'deleted',
        });
        return { content: [{ type: 'text', text: `Task ${args.task_id} deleted successfully` }] };
      } catch (error) {
        return { content: [{ type: 'text', text: `Error: ${(error as Error).message}` }], isError: true };
      }
    }
  );
}
