import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { TapdApiClient } from '../api/TapdApiClient.js';

export function registerPingTool(server: McpServer, client: TapdApiClient): void {
  server.registerTool(
    'tapd_ping',
    {
      title: 'Ping TAPD API',
      description: 'Check connectivity to the TAPD API. Returns server status and authentication validity.',
      inputSchema: {},
    },
    async () => {
      try {
        await client.get<Record<string, unknown>>('/workspaces', { limit: '1' });
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ status: 'ok', message: 'TAPD API is reachable and authenticated' }, null, 2),
          }],
        };
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ status: 'error', message: (error as Error).message }, null, 2),
          }],
          isError: true,
        };
      }
    }
  );
}
