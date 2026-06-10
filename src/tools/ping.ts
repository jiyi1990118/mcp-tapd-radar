import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { TapdApiClient } from '../api/TapdApiClient.js';
import { buildErrorResponse, toMcpError, toMcpText } from '../utils/response.js';

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
        return toMcpText({
          ok: true,
          tool: 'tapd_ping',
          summary: 'TAPD API is reachable and authenticated.',
          data: { status: 'ok' },
        });
      } catch (error) {
        return toMcpError(buildErrorResponse({ tool: 'tapd_ping', error }));
      }
    }
  );
}
