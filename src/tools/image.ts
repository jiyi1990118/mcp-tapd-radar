import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { TapdApiClient } from '../api/TapdApiClient.js';
import { logger } from '../utils/logger.js';
import { downloadTapdImage, getTapdClientAuth } from '../utils/tapdImages.js';

export function registerImageTools(server: McpServer, client: TapdApiClient): void {
  server.registerTool(
    'tapd_download_image',
    {
      title: 'Download TAPD Image',
      description:
        'Download an image from a TAPD URL that requires authentication. ' +
        'Returns the image as base64 so the AI agent can view and analyze it. ' +
        'Use this when a story/bug/task description contains image URLs (e.g. prototype screenshots, mockups) that you need to see.',
      inputSchema: {
        url: z.string().describe('The full TAPD image URL to download (e.g. https://api.tapd.cn/.../image/...)'),
      },
    },
    async (args) => {
      try {
        const imageUrl = args.url;
        logger.debug(`Downloading TAPD image: ${imageUrl}`);

        const { getToken } = getTapdClientAuth(client);
        const result = await downloadTapdImage(imageUrl, await getToken());

        if (!result.ok) {
          return {
            content: [{
              type: 'text' as const,
              text: result.message,
            }],
            isError: true,
          };
        }

        return {
          content: [
            result.content,
            {
              type: 'text' as const,
              text: `Image downloaded successfully (${(result.size / 1024).toFixed(1)} KB, ${result.mimeType})`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [{
            type: 'text' as const,
            text: `Error downloading image: ${(error as Error).message}`,
          }],
          isError: true,
        };
      }
    }
  );
}
