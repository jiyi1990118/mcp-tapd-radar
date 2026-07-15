import { TapdApiClient } from '../api/TapdApiClient.js';
import { buildDetailResponse } from './response.js';
import { unwrapTapdEntity } from './helpers.js';
import {
  downloadImagesToDisk,
  extractImageUrls,
  extractImageUrlsFromObject,
  guessImageMimeType,
  rewriteImageUrlsInObject,
  type FetchImageFn,
} from './imageStorage.js';

export type McpTextContent = { type: 'text'; text: string };
export type McpImageContent = { type: 'image'; data: string; mimeType: string };
export type McpContent = McpTextContent | McpImageContent;

export type DownloadImageResult =
  | { ok: true; content: McpImageContent; size: number; mimeType: string }
  | { ok: false; message: string };

type Fetcher = typeof fetch;

type DownloadOptions = {
  apiBaseUrl?: string;
  workspaceId?: string;
};

export { extractImageUrls, extractImageUrlsFromObject, guessImageMimeType };

function getTapdImagePath(imageUrl: string): string | null {
  try {
    const url = new URL(imageUrl);
    if (!url.pathname.replace(/\/+/g, '/').startsWith('/tfl/')) return null;
    return url.pathname.replace(/\/+/g, '/');
  } catch {
    return null;
  }
}

async function resolveTapdImageDownloadUrl(
  imageUrl: string,
  token: string,
  fetcher: Fetcher,
  options: DownloadOptions,
): Promise<string> {
  if (!options.apiBaseUrl || !options.workspaceId) return imageUrl;

  const imagePath = getTapdImagePath(imageUrl);
  if (!imagePath) return imageUrl;

  const url = new URL('/files/get_image', options.apiBaseUrl);
  url.searchParams.set('workspace_id', options.workspaceId);
  url.searchParams.set('image_path', imagePath);

  const response = await fetcher(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) return imageUrl;

  const result = await response.json().catch(() => null) as {
    status?: number;
    data?: { Attachment?: { download_url?: string } };
  } | null;

  return result?.status === 1 && result.data?.Attachment?.download_url
    ? result.data.Attachment.download_url
    : imageUrl;
}

export type FetchImageBufferResult =
  | { ok: true; buffer: Buffer; mimeType: string; size: number }
  | { ok: false; message: string };

export async function fetchImageBuffer(
  imageUrl: string,
  token: string,
  fetcher: Fetcher = fetch,
  options: DownloadOptions = {},
): Promise<FetchImageBufferResult> {
  const downloadUrl = await resolveTapdImageDownloadUrl(imageUrl, token, fetcher, options);
  const response = await fetcher(downloadUrl, {
    headers: downloadUrl === imageUrl ? { Authorization: `Bearer ${token}` } : {},
    redirect: 'follow',
  });

  if (!response.ok) {
    const permissionTip = response.status === 403
      ? ' If you encounter permission errors, please go to https://open.tapd.cn/admin/4002/permission to configure the application permissions.'
      : '';
    return { ok: false, message: `Failed to download image: HTTP ${response.status} ${response.statusText}.${permissionTip}` };
  }

  const contentType = response.headers.get('content-type')?.split(';')[0]?.trim();
  const mimeType = !contentType || contentType === 'image' ? guessImageMimeType(imageUrl) : contentType;
  if (!mimeType.startsWith('image/')) {
    const text = await response.text().catch(() => '');
    return {
      ok: false,
      message: `URL did not return an image. Content-Type: ${mimeType}. Response: ${text.slice(0, 500)}`,
    };
  }

  const arrayBuffer = await response.arrayBuffer();
  return {
    ok: true,
    buffer: Buffer.from(arrayBuffer),
    mimeType,
    size: arrayBuffer.byteLength,
  };
}

export async function downloadTapdImage(
  imageUrl: string,
  token: string,
  fetcher: Fetcher = fetch,
  options: DownloadOptions = {},
): Promise<DownloadImageResult> {
  const result = await fetchImageBuffer(imageUrl, token, fetcher, options);
  if (!result.ok) return result;
  return {
    ok: true,
    content: {
      type: 'image',
      data: result.buffer.toString('base64'),
      mimeType: result.mimeType,
    },
    size: result.size,
    mimeType: result.mimeType,
  };
}

export type DetailContentOptions = {
  baseUrl: string;
  getToken: () => Promise<string>;
  fetcher?: Fetcher;
  workspaceId?: string;
  autoDownloadLimit?: number;
  saveToDisk?: boolean;
  downloadDir?: string;
  downloadLimit?: number;
  concurrency?: number;
};

function inferEntityType(value: unknown): string {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return 'item';
  const keys = Object.keys(value as Record<string, unknown>);
  return keys.length === 1 ? keys[0].toLowerCase() : 'item';
}

function getEntityId(detail: unknown): string | undefined {
  const unwrapped = unwrapTapdEntity(detail);
  if (unwrapped && typeof unwrapped === 'object') {
    const id = (unwrapped as Record<string, unknown>).id;
    if (typeof id === 'string' && id) return id;
  }
  return undefined;
}

async function buildBase64Content(
  detail: unknown,
  options: DetailContentOptions,
  imageUrls: string[],
  entityType: string,
): Promise<McpContent[]> {
  const autoDownloadLimit = options.autoDownloadLimit ?? 3;
  const downloadTargets = imageUrls.slice(0, autoDownloadLimit);
  const downloadedImages: McpImageContent[] = [];
  const downloadErrors: string[] = [];

  if (downloadTargets.length > 0) {
    const token = await options.getToken();
    for (const imageUrl of downloadTargets) {
      const result = await downloadTapdImage(imageUrl, token, options.fetcher, {
        apiBaseUrl: options.baseUrl,
        workspaceId: options.workspaceId,
      });
      if (result.ok) downloadedImages.push(result.content);
      else downloadErrors.push(`${imageUrl}: ${result.message}`);
    }
  }

  const summary = {
    ...buildDetailResponse({
      tool: 'tapd_get_detail',
      entityType,
      item: detail,
      workspaceId: options.workspaceId,
      raw: detail,
    }),
    image_resources: {
      image_urls: imageUrls,
      auto_downloaded: downloadedImages.length,
      auto_download_limit: autoDownloadLimit,
      note: imageUrls.length > autoDownloadLimit
        ? `Only the first ${autoDownloadLimit} image(s) were downloaded automatically. Use tapd_download_image for the remaining URLs.`
        : undefined,
      download_errors: downloadErrors.length > 0 ? downloadErrors : undefined,
    },
  };

  return [{ type: 'text', text: JSON.stringify(summary, null, 2) }, ...downloadedImages];
}

async function buildDiskContent(
  detail: unknown,
  options: DetailContentOptions,
  imageUrls: string[],
  entityType: string,
): Promise<McpContent[]> {
  const entityId = getEntityId(detail);
  const downloadLimit = options.downloadLimit ?? 50;
  const concurrency = options.concurrency ?? 5;

  let urlToPath = new Map<string, string>();
  const resultStats = {
    total: imageUrls.length,
    downloaded: 0,
    skippedCached: 0,
    failed: 0,
    truncated: 0,
    errors: [] as string[],
  };

  if (imageUrls.length > 0 && options.downloadDir) {
    const token = await options.getToken();
    const fetchImage: FetchImageFn = (url) => fetchImageBuffer(url, token, options.fetcher, {
      apiBaseUrl: options.baseUrl,
      workspaceId: options.workspaceId,
    });
    const result = await downloadImagesToDisk({
      urls: imageUrls,
      fetchImage,
      downloadDir: options.downloadDir,
      workspaceId: options.workspaceId,
      entityType,
      entityId,
      concurrency,
      limit: downloadLimit,
    });
    urlToPath = result.urlToPath;
    resultStats.downloaded = result.downloaded;
    resultStats.skippedCached = result.skippedCached;
    resultStats.failed = result.failed;
    resultStats.truncated = result.truncated;
    resultStats.errors = result.errors;
  }

  const rewritten = rewriteImageUrlsInObject(detail, options.baseUrl, urlToPath);

  const detailResponse = buildDetailResponse({
    tool: 'tapd_get_detail',
    entityType,
    item: rewritten,
    workspaceId: options.workspaceId,
    raw: rewritten,
  });

  // buildDetailResponse strips HTML from `description` (via compactText), which would
  // discard the local-path placeholders. Restore the rewritten description (with local
  // paths intact) so downstream tools can locate each image by its local path.
  const rewrittenDescription = getRewrittenDescription(rewritten);
  if (rewrittenDescription !== undefined) {
    const data = detailResponse.data as Record<string, unknown> | undefined;
    const item = data?.item as Record<string, unknown> | undefined;
    if (item) item.description = rewrittenDescription;
  }

  const summary = {
    ...detailResponse,
    image_resources: {
      mode: 'disk',
      image_count: imageUrls.length,
      downloaded: resultStats.downloaded,
      skipped_cached: resultStats.skippedCached,
      failed: resultStats.failed,
      download_dir: options.downloadDir,
      note: resultStats.truncated > 0
        ? `${resultStats.truncated} image(s) exceeded the download limit (${downloadLimit}) and were left as remote URLs. Raise TAPD_IMAGE_DOWNLOAD_LIMIT to fetch them.`
        : 'Image URLs in the content have been replaced with local file paths. Parse the image at each path and insert the analysis result back at that position.',
      errors: resultStats.errors.length > 0 ? resultStats.errors : undefined,
    },
  };

  return [{ type: 'text', text: JSON.stringify(summary, null, 2) }];
}

function getRewrittenDescription(rewritten: unknown): string | undefined {
  const unwrapped = unwrapTapdEntity(rewritten);
  if (unwrapped && typeof unwrapped === 'object') {
    const description = (unwrapped as Record<string, unknown>).description;
    if (typeof description === 'string') return description;
  }
  return undefined;
}

export async function buildTapdDetailContent(
  detail: unknown,
  options: DetailContentOptions,
): Promise<McpContent[]> {
  const entityType = inferEntityType(detail);
  const imageUrls = extractImageUrlsFromObject(detail, options.baseUrl);

  if (options.saveToDisk) {
    return buildDiskContent(detail, options, imageUrls, entityType);
  }
  return buildBase64Content(detail, options, imageUrls, entityType);
}

export function getTapdClientAuth(client: TapdApiClient): { baseUrl: string; getToken: () => Promise<string> } {
  return {
    baseUrl: client.getBaseUrl(),
    getToken: () => client.getAuthToken(),
  };
}
