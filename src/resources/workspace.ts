import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { TapdApiClient } from '../api/TapdApiClient.js';
import { convertDataToArray } from '../utils/helpers.js';

export function registerResources(server: McpServer, client: TapdApiClient): void {
  server.registerResource(
    'webhook-help',
    'tapd://webhooks/help',
    {
      title: 'TAPD Webhook Configuration',
      description: 'TAPD does not expose a webhook API. Read this to learn how to configure webhooks via the web UI.',
      mimeType: 'application/json',
    },
    async (uri) => {
      const body = {
        note: 'TAPD Open Platform does NOT expose a /webhooks API. Webhook tools were removed because they only stored config in memory and never created real webhooks.',
        instructions: 'Configure webhooks via the TAPD web UI (Project Settings > Webhooks), not via this MCP server.',
        help_url: 'https://www.tapd.cn/help/view#1120003271001002318',
        supported_events_hint: 'story::create, bug::update, task::status_change, etc.',
      };
      return {
        contents: [{ uri: uri.href, text: JSON.stringify(body, null, 2), mimeType: 'application/json' }],
      };
    }
  );

  server.registerResource(
    'workspaces',
    'tapd://workspaces',
    {
      title: 'TAPD Workspaces',
      description: 'List all accessible TAPD workspaces (projects)',
      mimeType: 'application/json',
    },
    async (uri) => {
      try {
        const data = await client.get<Record<string, unknown>>('/workspaces');
        return {
          contents: [{ uri: uri.href, text: JSON.stringify(convertDataToArray(data), null, 2), mimeType: 'application/json' }],
        };
      } catch (error) {
        return {
          contents: [{ uri: uri.href, text: JSON.stringify({ error: (error as Error).message }), mimeType: 'application/json' }],
        };
      }
    }
  );

  server.registerResource(
    'workspace-detail',
    new ResourceTemplate('tapd://workspace/{workspace_id}', { list: undefined }),
    {
      title: 'TAPD Workspace Detail',
      description: 'Get detailed information about a specific TAPD workspace',
      mimeType: 'application/json',
    },
    async (uri, { workspace_id }) => {
      try {
        const data = await client.get<Record<string, unknown>>('/workspaces', { workspace_id: workspace_id as string });
        const workspace = data ? Object.values(data)[0] : null;
        return {
          contents: [{ uri: uri.href, text: JSON.stringify(workspace, null, 2), mimeType: 'application/json' }],
        };
      } catch (error) {
        return {
          contents: [{ uri: uri.href, text: JSON.stringify({ error: (error as Error).message }), mimeType: 'application/json' }],
        };
      }
    }
  );

  server.registerResource(
    'stories-overview',
    new ResourceTemplate('tapd://stories/{workspace_id}', { list: undefined }),
    {
      title: 'TAPD Stories Overview',
      description: 'Get an overview of stories in a TAPD workspace',
      mimeType: 'application/json',
    },
    async (uri, { workspace_id }) => {
      try {
        const data = await client.get<Record<string, unknown>>('/stories', {
          workspace_id: workspace_id as string,
          limit: '30',
          fields: 'id,name,status,owner,priority,iteration_id',
        });
        return {
          contents: [{ uri: uri.href, text: JSON.stringify(convertDataToArray(data), null, 2), mimeType: 'application/json' }],
        };
      } catch (error) {
        return {
          contents: [{ uri: uri.href, text: JSON.stringify({ error: (error as Error).message }), mimeType: 'application/json' }],
        };
      }
    }
  );

  server.registerResource(
    'bugs-overview',
    new ResourceTemplate('tapd://bugs/{workspace_id}', { list: undefined }),
    {
      title: 'TAPD Bugs Overview',
      description: 'Get an overview of bugs in a TAPD workspace',
      mimeType: 'application/json',
    },
    async (uri, { workspace_id }) => {
      try {
        const data = await client.get<Record<string, unknown>>('/bugs', {
          workspace_id: workspace_id as string,
          limit: '30',
          fields: 'id,title,status,severity,priority,current_owner',
        });
        return {
          contents: [{ uri: uri.href, text: JSON.stringify(convertDataToArray(data), null, 2), mimeType: 'application/json' }],
        };
      } catch (error) {
        return {
          contents: [{ uri: uri.href, text: JSON.stringify({ error: (error as Error).message }), mimeType: 'application/json' }],
        };
      }
    }
  );

  server.registerResource(
    'iterations-overview',
    new ResourceTemplate('tapd://iterations/{workspace_id}', { list: undefined }),
    {
      title: 'TAPD Iterations Overview',
      description: 'Get an overview of iterations in a TAPD workspace',
      mimeType: 'application/json',
    },
    async (uri, { workspace_id }) => {
      try {
        const data = await client.get<Record<string, unknown>>('/iterations', {
          workspace_id: workspace_id as string,
        });
        return {
          contents: [{ uri: uri.href, text: JSON.stringify(convertDataToArray(data), null, 2), mimeType: 'application/json' }],
        };
      } catch (error) {
        return {
          contents: [{ uri: uri.href, text: JSON.stringify({ error: (error as Error).message }), mimeType: 'application/json' }],
        };
      }
    }
  );
}
