import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { TapdApiClient } from '../api/TapdApiClient.js';
import { logger } from '../utils/logger.js';
import { downloadImagesToDisk, extFromMime, guessImageMimeType } from '../utils/imageStorage.js';
import { downloadTapdImage, fetchImageBuffer, getTapdClientAuth } from '../utils/tapdImages.js';
import { resolveImageDiskSettings } from '../utils/imageConfig.js';
import { buildErrorResponse, toMcpError } from '../utils/response.js';

export function registerImageTools(server: McpServer, client: TapdApiClient): void {
  server.registerTool(
    'tapd_download_image',
    {
      title: 'Download TAPD Image',
      description: 'Download an image from a TAPD image URL that requires authentication. NOTE: tapd_get_story/bug/task already auto-download description images to disk by default - you usually do NOT need this tool. Use this only when you have a standalone image URL not embedded in a description, or when download_images=false was set. Set save_to_disk=true (default) to save to a local file path; false returns base64 inline.',
      inputSchema: {
        url: z.string().describe('The full TAPD image URL to download / 图片URL (e.g. https://api.tapd.cn/.../image/...)'),
        workspace_id: z.string().optional().describe('TAPD workspace/project ID. REQUIRED for /tfl/captures image paths (the tool resolves a temp download URL via /files/get_image). Optional for direct image URLs.'),
        save_to_disk: z.boolean().optional().describe('Write to local file (true, default) instead of inlining base64 (false). When true, returns the local file path.'),
        image_dir: z.string().optional().describe('Local directory for the downloaded image / 图片下载目录. Defaults to env TAPD_IMAGE_DOWNLOAD_DIR (./.tapd-images).'),
      },
    },
    async (args) => {
      try {
        const imageUrl = args.url;
        logger.debug(`Downloading TAPD image: ${imageUrl}`);

        const { baseUrl, getToken } = getTapdClientAuth(client);
        const token = await getToken();
        const settings = resolveImageDiskSettings({ enabled: args.save_to_disk, downloadDir: args.image_dir });

        if (settings.enabled) {
          const result = await downloadImagesToDisk({
            urls: [imageUrl],
            fetchImage: (url) => fetchImageBuffer(url, token, fetch, {
              apiBaseUrl: baseUrl,
              workspaceId: args.workspace_id,
            }),
            downloadDir: settings.downloadDir,
            workspaceId: args.workspace_id,
            entityType: 'image',
            entityId: 'single',
            concurrency: 1,
            limit: 1,
          });

          const localPath = result.urlToPath.get(imageUrl);
          if (!localPath) {
            const message = result.errors[0] || 'Failed to save image to disk.';
            return toMcpError(buildErrorResponse({ tool: 'tapd_download_image', error: new Error(message), workspaceId: args.workspace_id }));
          }

          const mimeType = result.urlToMime.get(imageUrl) ?? guessImageMimeType(imageUrl);
          const ext = extFromMime(mimeType);
          return {
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify({
                  ok: true,
                  tool: 'tapd_download_image',
                  saved_to_disk: true,
                  path: localPath,
                  mimeType,
                  extension: ext,
                  note: 'Image saved to disk. Parse the file at this path to analyze its content.',
                }, null, 2),
              },
            ],
          };
        }

        const result = await downloadTapdImage(imageUrl, token, fetch, {
          apiBaseUrl: baseUrl,
          workspaceId: args.workspace_id,
        });

        if (!result.ok) {
          return toMcpError(buildErrorResponse({ tool: 'tapd_download_image', error: new Error(result.message), workspaceId: args.workspace_id }));
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
        return toMcpError(buildErrorResponse({ tool: 'tapd_download_image', error, workspaceId: args.workspace_id }));
      }
    }
  );
}
