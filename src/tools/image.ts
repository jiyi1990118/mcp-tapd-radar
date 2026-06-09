import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { TapdApiClient } from '../api/TapdApiClient.js';
import { logger } from '../utils/logger.js';

const IMAGE_MIME_MAP: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  bmp: 'image/bmp',
  ico: 'image/x-icon',
};

function guessMimeType(url: string): string {
  const pathname = new URL(url).pathname.toLowerCase();
  for (const [ext, mime] of Object.entries(IMAGE_MIME_MAP)) {
    if (pathname.endsWith(`.${ext}`)) return mime;
  }
  return 'image/png';
}

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

        const token = await (client as unknown as { authManager: { getToken(): Promise<string> } }).authManager.getToken();

        const response = await fetch(imageUrl, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          redirect: 'follow',
        });

        if (!response.ok) {
          return {
            content: [{
              type: 'text' as const,
              text: `Failed to download image: HTTP ${response.status} ${response.statusText}. ${response.status === 403 ? 'If you encounter permission errors, please go to https://open.tapd.cn/admin/4002/permission to configure the application permissions.' : ''}`,
            }],
            isError: true,
          };
        }

        const mimeType = response.headers.get('content-type')?.split(';')[0]?.trim() || guessMimeType(imageUrl);

        if (!mimeType.startsWith('image/')) {
          const text = await response.text().catch(() => '');
          return {
            content: [{
              type: 'text' as const,
              text: `URL did not return an image. Content-Type: ${mimeType}. Response: ${text.slice(0, 500)}`,
            }],
            isError: true,
          };
        }

        const arrayBuffer = await response.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');

        return {
          content: [
            {
              type: 'image' as const,
              data: base64,
              mimeType,
            },
            {
              type: 'text' as const,
              text: `Image downloaded successfully (${(arrayBuffer.byteLength / 1024).toFixed(1)} KB, ${mimeType})`,
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
