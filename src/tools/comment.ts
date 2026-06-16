import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { TapdApiClient } from '../api/TapdApiClient.js';
import { QueryBuilder } from '../api/QueryBuilder.js';
import { convertDataToArray } from '../utils/helpers.js';
import { buildErrorResponse, buildListResponse, buildOperationResponse, toMcpError, toMcpText } from '../utils/response.js';

/**
 * TAPD API entry_type mapping:
 * - user inputs: story | bug | task
 * - API expects: stories | bug | tasks
 */
const ENTRY_TYPE_MAP: Record<string, string> = {
  story: 'stories',
  bug: 'bug',
  task: 'tasks',
};

function toApiEntryType(input: string): string {
  return ENTRY_TYPE_MAP[input] || input;
}

export function registerCommentTools(server: McpServer, client: TapdApiClient): void {
  server.registerTool(
    'tapd_list_comments',
    {
      title: 'List TAPD Comments',
      description: 'List comments on a TAPD entity (story, bug, or task).',
      inputSchema: {
        workspace_id: z.string().describe('TAPD workspace/project ID'),
        entry_type: z.string().describe('Entity type: story|bug|task'),
        entry_id: z.string().describe('The ID of the story, bug, or task'),
        limit: z.number().optional().describe('Results per page (default 30, max 200)'),
        page: z.number().optional().describe('Page number (starts from 1)'),
      },
    },
    async (args) => {
      try {
        const apiEntryType = toApiEntryType(args.entry_type);
        const qb = new QueryBuilder()
          .add('workspace_id', args.workspace_id)
          .add('entry_type', apiEntryType)
          .add('entry_id', args.entry_id)
          .addPagination(args.limit, args.page);

        const data = await client.get<Record<string, unknown>>('/comments', Object.fromEntries(new URLSearchParams(qb.build())));
        return toMcpText(buildListResponse({
          tool: 'tapd_list_comments',
          entityType: 'comment',
          items: convertDataToArray(data),
          workspaceId: args.workspace_id,
          filters: { entry_type: args.entry_type, entry_id: args.entry_id },
          limit: args.limit,
          page: args.page,
        }));
      } catch (error) {
        return toMcpError(buildErrorResponse({ tool: 'tapd_list_comments', error, workspaceId: args.workspace_id, entityType: 'comment', entityId: args.entry_id }));
      }
    }
  );

  server.registerTool(
    'tapd_create_comment',
    {
      title: 'Create TAPD Comment',
      description: 'Add a comment to a TAPD story, bug, or task.',
      inputSchema: {
        workspace_id: z.string().describe('TAPD workspace/project ID'),
        entry_type: z.string().describe('Entity type: story|bug|task'),
        entry_id: z.string().describe('The ID of the story, bug, or task to comment on'),
        description: z.string().describe('Comment content'),
        author: z.string().optional().describe('Comment author (defaults to current user)'),
      },
    },
    async (args) => {
      try {
        const apiEntryType = toApiEntryType(args.entry_type);
        const body: Record<string, unknown> = {
          workspace_id: args.workspace_id,
          entry_type: apiEntryType,
          entry_id: args.entry_id,
          description: args.description,
        };
        if (args.author) body.author = args.author;

        const data = await client.post<Record<string, unknown>>('/comments', body);
        const comment = data ? Object.values(data)[0] : null;
        return toMcpText(buildOperationResponse({ tool: 'tapd_create_comment', action: 'created', entityType: 'comment', item: comment, entityId: args.entry_id, workspaceId: args.workspace_id }));
      } catch (error) {
        return toMcpError(buildErrorResponse({ tool: 'tapd_create_comment', error, workspaceId: args.workspace_id, entityType: 'comment', entityId: args.entry_id }));
      }
    }
  );
}
