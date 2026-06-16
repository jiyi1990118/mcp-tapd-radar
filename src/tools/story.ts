import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { TapdApiClient } from '../api/TapdApiClient.js';
import { QueryBuilder } from '../api/QueryBuilder.js';
import { convertDataToArray, pickDefined } from '../utils/helpers.js';
import { buildTapdDetailContent, getTapdClientAuth } from '../utils/tapdImages.js';
import { buildCountResponse, buildErrorResponse, buildListResponse, buildOperationResponse, toMcpError, toMcpText } from '../utils/response.js';

const STORY_FIELDS = [
  'name', 'description', 'status', 'owner', 'priority', 'iteration_id',
  'begin', 'due', 'size', 'category_id', 'estimate',
  'custom_field_one', 'custom_field_two', 'custom_field_three', 'custom_field_four',
  'custom_field_five', 'custom_field_six', 'custom_field_seven', 'custom_field_eight',
];

export function registerStoryTools(server: McpServer, client: TapdApiClient): void {
  server.registerTool(
    'tapd_list_stories',
    {
      title: 'List TAPD Stories',
      description: 'List stories (requirements) in a TAPD workspace with filtering and pagination. Returns an array of story objects.',
      inputSchema: {
        workspace_id: z.string().describe('TAPD workspace/project ID'),
        status: z.string().optional().describe('Filter by status, supports OR with |, e.g. "new|in_progress"'),
        owner: z.string().optional().describe('Filter by owner (handler)'),
        creator: z.string().optional().describe('Filter by creator'),
        priority: z.string().optional().describe('Filter by priority'),
        iteration_id: z.string().optional().describe('Filter by iteration ID. Use "<>id" for not equal'),
        created: z.string().optional().describe('Filter by created time. Supports >date, <date, date~date'),
        modified: z.string().optional().describe('Filter by modified time. Supports >date, <date, date~date'),
        name: z.string().optional().describe('Fuzzy search by story name'),
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
          .add('priority', args.priority)
          .add('iteration_id', args.iteration_id)
          .addTimeRange('created', args.created)
          .addTimeRange('modified', args.modified)
          .addLike('name', args.name)
          .addPagination(args.limit, args.page);

        if (args.fields) qb.add('fields', args.fields);

        const data = await client.get<Record<string, unknown>>('/stories', Object.fromEntries(new URLSearchParams(qb.build())));
        return toMcpText(buildListResponse({
          tool: 'tapd_list_stories',
          entityType: 'story',
          items: convertDataToArray(data),
          workspaceId: args.workspace_id,
          filters: pickDefined(args as Record<string, unknown>, ['status', 'owner', 'creator', 'priority', 'iteration_id', 'created', 'modified', 'name']),
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
      description: 'Get detailed information about a specific TAPD story by its ID.',
      inputSchema: {
        workspace_id: z.string().describe('TAPD workspace/project ID'),
        story_id: z.string().describe('The story ID to retrieve'),
        fields: z.string().optional().describe('Comma-separated list of fields to return'),
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
        return { content: await buildTapdDetailContent(story, { ...clientAuth, workspaceId: args.workspace_id }) };
      } catch (error) {
        return toMcpError(buildErrorResponse({ tool: 'tapd_get_story', error, workspaceId: args.workspace_id, entityType: 'story', entityId: args.story_id }));
      }
    }
  );

  server.registerTool(
    'tapd_create_story',
    {
      title: 'Create TAPD Story',
      description: 'Create a new story (requirement) in a TAPD workspace.',
      inputSchema: {
        workspace_id: z.string().describe('TAPD workspace/project ID'),
        name: z.string().describe('Story title (required)'),
        description: z.string().optional().describe('Story description'),
        status: z.string().optional().describe('Initial status (default: new)'),
        owner: z.string().optional().describe('Handler/owner of the story'),
        priority: z.string().optional().describe('Priority level'),
        iteration_id: z.string().optional().describe('Iteration to assign the story to'),
        begin: z.string().optional().describe('Start date (YYYY-MM-DD)'),
        due: z.string().optional().describe('Due date (YYYY-MM-DD)'),
        category_id: z.string().optional().describe('Category ID'),
        estimate: z.number().optional().describe('Story estimate (work hours / person-days)'),
        custom_field_one: z.string().optional().describe('Custom field 1'),
        custom_field_two: z.string().optional().describe('Custom field 2'),
        custom_field_three: z.string().optional().describe('Custom field 3'),
        custom_field_four: z.string().optional().describe('Custom field 4'),
        custom_field_five: z.string().optional().describe('Custom field 5'),
        custom_field_six: z.string().optional().describe('Custom field 6'),
        custom_field_seven: z.string().optional().describe('Custom field 7'),
        custom_field_eight: z.string().optional().describe('Custom field 8'),
      },
    },
    async (args) => {
      try {
        const body: Record<string, unknown> = {
          workspace_id: args.workspace_id,
          name: args.name,
          ...pickDefined(args as Record<string, unknown>, STORY_FIELDS),
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
      description: 'Update an existing TAPD story. Only provided fields will be updated.',
      inputSchema: {
        workspace_id: z.string().describe('TAPD workspace/project ID'),
        story_id: z.string().describe('The story ID to update'),
        name: z.string().optional().describe('New story title'),
        description: z.string().optional().describe('New description'),
        status: z.string().optional().describe('New status'),
        owner: z.string().optional().describe('New owner/handler'),
        priority: z.string().optional().describe('New priority'),
        iteration_id: z.string().optional().describe('New iteration ID'),
        begin: z.string().optional().describe('New start date'),
        due: z.string().optional().describe('New due date'),
        size: z.string().optional().describe('Story size/scale'),
        category_id: z.string().optional().describe('New category ID'),
        estimate: z.number().optional().describe('New estimate (work hours / person-days)'),
        custom_field_one: z.string().optional().describe('Custom field 1'),
        custom_field_two: z.string().optional().describe('Custom field 2'),
        custom_field_three: z.string().optional().describe('Custom field 3'),
        custom_field_four: z.string().optional().describe('Custom field 4'),
        custom_field_five: z.string().optional().describe('Custom field 5'),
        custom_field_six: z.string().optional().describe('Custom field 6'),
        custom_field_seven: z.string().optional().describe('Custom field 7'),
        custom_field_eight: z.string().optional().describe('Custom field 8'),
      },
    },
    async (args) => {
      try {
        const body: Record<string, unknown> = {
          workspace_id: args.workspace_id,
          id: args.story_id,
          ...pickDefined(args as Record<string, unknown>, STORY_FIELDS),
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
    'tapd_count_stories',
    {
      title: 'Count TAPD Stories',
      description: 'Count the number of stories matching the given filters in a TAPD workspace.',
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

        const data = await client.get<{ count: number }>('/stories/count', Object.fromEntries(new URLSearchParams(qb.build())));
        return toMcpText(buildCountResponse({
          tool: 'tapd_count_stories',
          entityType: 'story',
          count: data,
          workspaceId: args.workspace_id,
          filters: pickDefined(args as Record<string, unknown>, ['status', 'owner', 'creator', 'priority', 'iteration_id', 'created', 'modified']),
        }));
      } catch (error) {
        return toMcpError(buildErrorResponse({ tool: 'tapd_count_stories', error, workspaceId: args.workspace_id, entityType: 'story' }));
      }
    }
  );

  server.registerTool(
    'tapd_delete_story',
    {
      title: 'Delete TAPD Story',
      description: 'Delete a TAPD story by its ID.',
      inputSchema: {
        workspace_id: z.string().describe('TAPD workspace/project ID'),
        story_id: z.string().describe('The story ID to delete'),
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
      description: 'Update multiple stories at once with the same field values. More efficient than updating one by one.',
      inputSchema: {
        workspace_id: z.string().describe('TAPD workspace/project ID'),
        story_ids: z.string().describe('Comma-separated story IDs, e.g. "123,456,789"'),
        status: z.string().optional().describe('New status for all stories'),
        owner: z.string().optional().describe('New owner/handler'),
        priority: z.string().optional().describe('New priority'),
        iteration_id: z.string().optional().describe('New iteration ID'),
      },
    },
    async (args) => {
      try {
        const ids = args.story_ids.split(',').map(id => id.trim());
        const fields = pickDefined(args as Record<string, unknown>, ['status', 'owner', 'priority', 'iteration_id']);

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
