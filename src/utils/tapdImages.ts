import { TapdApiClient } from '../api/TapdApiClient.js';
import { buildDetailResponse } from './response.js';

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

const IMAGE_URL_PATTERN = /^https?:\/\/[^\s"'<>)]+\.(?:png|jpe?g|gif|webp|svg|bmp|ico)(?:\?[^\s"'<>)]*)?$/i;
const TAPD_IMAGE_PATH_PATTERN = /^https?:\/\/[^\s"'<>)]+\/[^\s"'<>)]*(?:image|img|attachment|file|download)[^\s"'<>)]*(?:\?[^\s"'<>)]*)?$/i;
const RAW_IMAGE_URL_PATTERN = /https?:\/\/[^\s"'<>)]+\.(?:png|jpe?g|gif|webp|svg|bmp|ico)(?:\?[^\s"'<>)]*)?/gi;

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

export function guessImageMimeType(url: string): string {
  const pathname = new URL(url).pathname.toLowerCase();
  for (const [ext, mime] of Object.entries(IMAGE_MIME_MAP)) {
    if (pathname.endsWith(`.${ext}`)) return mime;
  }
  return 'image/png';
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function normalizeImageUrl(value: string, baseUrl: string): string | null {
  const trimmed = decodeHtmlEntities(value).trim();
  try {
    const url = new URL(trimmed, baseUrl);
    const normalized = url.toString();
    return IMAGE_URL_PATTERN.test(normalized) || TAPD_IMAGE_PATH_PATTERN.test(normalized) ? normalized : null;
  } catch {
    return null;
  }
}

export function extractImageUrls(text: string | undefined | null, baseUrl: string): string[] {
  if (!text) return [];

  const candidates: string[] = [];
  const htmlImagePattern = /<img\b[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>/gi;
  const markdownImagePattern = /!\[[^\]]*\]\(([^\s)]+)(?:\s+"[^"]*")?\)/gi;

  for (const match of text.matchAll(htmlImagePattern)) candidates.push(match[1]);
  for (const match of text.matchAll(markdownImagePattern)) candidates.push(match[1]);
  for (const match of text.matchAll(RAW_IMAGE_URL_PATTERN)) candidates.push(match[0]);

  const normalized = candidates
    .map(candidate => normalizeImageUrl(candidate, baseUrl))
    .filter((url): url is string => Boolean(url));

  return Array.from(new Set(normalized));
}

function collectTextValues(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(item => collectTextValues(item));
  if (value && typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).flatMap(item => collectTextValues(item));
  }
  return [];
}

export function extractImageUrlsFromObject(value: unknown, baseUrl: string): string[] {
  return Array.from(new Set(collectTextValues(value).flatMap(text => extractImageUrls(text, baseUrl))));
}

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

export async function downloadTapdImage(
  imageUrl: string,
  token: string,
  fetcher: Fetcher = fetch,
  options: DownloadOptions = {},
): Promise<DownloadImageResult> {
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
    content: {
      type: 'image',
      data: Buffer.from(arrayBuffer).toString('base64'),
      mimeType,
    },
    size: arrayBuffer.byteLength,
    mimeType,
  };
}

export async function buildTapdDetailContent(
  detail: unknown,
  options: {
    baseUrl: string;
    getToken: () => Promise<string>;
    fetcher?: Fetcher;
    autoDownloadLimit?: number;
    workspaceId?: string;
  },
): Promise<McpContent[]> {
  const autoDownloadLimit = options.autoDownloadLimit ?? 3;
  const imageUrls = extractImageUrlsFromObject(detail, options.baseUrl);
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
      entityType: inferEntityType(detail),
      item: unwrapTapdEntity(detail),
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

function unwrapTapdEntity(value: unknown): unknown {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value;
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record);
  if (keys.length === 1 && record[keys[0]] && typeof record[keys[0]] === 'object') return record[keys[0]];
  return value;
}

function inferEntityType(value: unknown): string {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return 'item';
  const keys = Object.keys(value as Record<string, unknown>);
  return keys.length === 1 ? keys[0].toLowerCase() : 'item';
}

export function getTapdClientAuth(client: TapdApiClient): { baseUrl: string; getToken: () => Promise<string> } {
  const internal = client as unknown as {
    baseUrl: string;
    authManager: { getToken(): Promise<string> };
  };

  return {
    baseUrl: internal.baseUrl,
    getToken: () => internal.authManager.getToken(),
  };
}
