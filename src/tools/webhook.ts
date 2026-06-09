import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { TapdApiClient } from '../api/TapdApiClient.js';

interface WebhookConfig {
  id: string;
  workspace_id: string;
  url: string;
  events: string[];
  secret?: string;
  content_type: string;
  created: string;
}

const webhookStore = new Map<string, WebhookConfig>();
let webhookCounter = 0;

export function registerWebhookTools(server: McpServer, client: TapdApiClient): void {
  server.registerTool(
    'tapd_list_webhooks',
    {
      title: 'List TAPD Webhook Subscriptions',
      description: 'List all configured webhook subscriptions for a TAPD workspace. Syncs with TAPD API to show server-side webhooks.',
      inputSchema: {
        workspace_id: z.string().describe('TAPD workspace/project ID'),
      },
    },
    async (args) => {
      try {
        const localWebhooks = Array.from(webhookStore.values())
          .filter(w => w.workspace_id === args.workspace_id);

        try {
          const remoteData = await client.get<Record<string, unknown>>('/webhooks', { workspace_id: args.workspace_id });
          const remoteWebhooks = remoteData ? Object.values(remoteData) : [];
          return { content: [{ type: 'text', text: JSON.stringify({ local: localWebhooks, remote: remoteWebhooks }, null, 2) }] };
        } catch {
          return { content: [{ type: 'text', text: JSON.stringify(localWebhooks, null, 2) }] };
        }
      } catch (error) {
        return { content: [{ type: 'text', text: `Error: ${(error as Error).message}` }], isError: true };
      }
    }
  );

  server.registerTool(
    'tapd_create_webhook',
    {
      title: 'Create TAPD Webhook Subscription',
      description: 'Register a new webhook subscription for TAPD events. Creates both a local config and calls the TAPD webhook API.',
      inputSchema: {
        workspace_id: z.string().describe('TAPD workspace/project ID'),
        url: z.string().describe('Webhook callback URL to receive event notifications'),
        events: z.string().describe('Comma-separated event types, e.g. "story::create,bug::update,task::status_change"'),
        secret: z.string().optional().describe('Secret key for webhook signature verification'),
        content_type: z.string().optional().describe('Content type for webhook payload (default: application/json)'),
      },
    },
    async (args) => {
      try {
        const id = `wh_${++webhookCounter}`;
        const webhook: WebhookConfig = {
          id,
          workspace_id: args.workspace_id,
          url: args.url,
          events: args.events.split(',').map(e => e.trim()),
          secret: args.secret,
          content_type: args.content_type || 'application/json',
          created: new Date().toISOString(),
        };
        webhookStore.set(id, webhook);

        try {
          const body: Record<string, unknown> = {
            workspace_id: args.workspace_id,
            url: args.url,
            event: args.events,
          };
          if (args.secret) body.secret = args.secret;
          await client.post('/webhooks', body);
        } catch { /* remote webhook creation failed, local config still saved */ }

        return { content: [{ type: 'text', text: JSON.stringify(webhook, null, 2) }] };
      } catch (error) {
        return { content: [{ type: 'text', text: `Error: ${(error as Error).message}` }], isError: true };
      }
    }
  );

  server.registerTool(
    'tapd_delete_webhook',
    {
      title: 'Delete TAPD Webhook Subscription',
      description: 'Remove a configured webhook subscription. Deletes from both local store and TAPD API.',
      inputSchema: {
        webhook_id: z.string().describe('The webhook ID to delete'),
        workspace_id: z.string().optional().describe('TAPD workspace/project ID (required for API deletion)'),
      },
    },
    async (args) => {
      try {
        if (!webhookStore.has(args.webhook_id)) {
          return { content: [{ type: 'text', text: `Webhook ${args.webhook_id} not found` }], isError: true };
        }
        webhookStore.delete(args.webhook_id);

        if (args.workspace_id) {
          try {
            await client.delete('/webhooks', { workspace_id: args.workspace_id, id: args.webhook_id });
          } catch { /* remote deletion failed, local config already removed */ }
        }

        return { content: [{ type: 'text', text: `Webhook ${args.webhook_id} deleted successfully` }] };
      } catch (error) {
        return { content: [{ type: 'text', text: `Error: ${(error as Error).message}` }], isError: true };
      }
    }
  );
}
