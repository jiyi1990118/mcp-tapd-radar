import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { TapdApiClient } from '../api/TapdApiClient.js';

/**
 * ⚠️ IMPORTANT: TAPD Open Platform does NOT expose a /webhooks API endpoint.
 * All webhook operations are local-only (in-memory store).
 * Real webhook configuration must be done via TAPD web UI:
 * https://www.tapd.cn/help/view#1120003271001002318
 */

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

export function registerWebhookTools(server: McpServer, _client: TapdApiClient): void {
  server.registerTool(
    'tapd_list_webhooks',
    {
      title: 'List TAPD Webhook Subscriptions',
      description: 'List locally configured webhook subscriptions. Note: TAPD API does not expose webhook management endpoints; real webhooks must be configured via TAPD web UI.',
      inputSchema: {
        workspace_id: z.string().describe('TAPD workspace/project ID'),
      },
    },
    async (args) => {
      try {
        const localWebhooks = Array.from(webhookStore.values())
          .filter(w => w.workspace_id === args.workspace_id);
        return { content: [{ type: 'text', text: JSON.stringify(localWebhooks, null, 2) }] };
      } catch (error) {
        return { content: [{ type: 'text', text: `Error: ${(error as Error).message}` }], isError: true };
      }
    }
  );

  server.registerTool(
    'tapd_create_webhook',
    {
      title: 'Create TAPD Webhook Subscription',
      description: 'Register a webhook subscription locally. Note: This only creates a local config. Real webhook must be configured via TAPD web UI at https://www.tapd.cn/help/view#1120003271001002318',
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
      description: 'Remove a locally configured webhook subscription. Note: TAPD API does not expose webhook deletion endpoint.',
      inputSchema: {
        webhook_id: z.string().describe('The webhook ID to delete'),
      },
    },
    async (args) => {
      try {
        if (!webhookStore.has(args.webhook_id)) {
          return { content: [{ type: 'text', text: `Webhook ${args.webhook_id} not found` }], isError: true };
        }
        webhookStore.delete(args.webhook_id);

        return { content: [{ type: 'text', text: `Webhook ${args.webhook_id} deleted successfully` }] };
      } catch (error) {
        return { content: [{ type: 'text', text: `Error: ${(error as Error).message}` }], isError: true };
      }
    }
  );
}
