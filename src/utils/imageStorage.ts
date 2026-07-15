import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

export const IMAGE_MIME_MAP: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  bmp: 'image/bmp',
  ico: 'image/x-icon',
};

const MIME_TO_EXT: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'image/bmp': 'bmp',
  'image/x-icon': 'ico',
};

const IMAGE_URL_PATTERN = /^https?:\/\/[^\s"'<>)]+\.(?:png|jpe?g|gif|webp|svg|bmp|ico)(?:\?[^\s"'<>)]*)?$/i;
const TAPD_IMAGE_PATH_PATTERN = /^https?:\/\/[^\s"'<>)]+\/[^\s"'<>)]*(?:image|img|attachment|file|download)[^\s"'<>)]*(?:\?[^\s"'<>)]*)?$/i;
const RAW_IMAGE_URL_PATTERN = /https?:\/\/[^\s"'<>)]+\.(?:png|jpe?g|gif|webp|svg|bmp|ico)(?:\?[^\s"'<>)]*)?/gi;

export function guessImageMimeType(url: string): string {
  const pathname = new URL(url).pathname.toLowerCase();
  for (const [ext, mime] of Object.entries(IMAGE_MIME_MAP)) {
    if (pathname.endsWith(`.${ext}`)) return mime;
  }
  return 'image/png';
}

export function extFromMime(mime: string): string {
  return MIME_TO_EXT[mime] || 'png';
}

function mimeFromFilePath(filePath: string): string {
  const ext = path.extname(filePath).slice(1).toLowerCase();
  return IMAGE_MIME_MAP[ext] || 'image/png';
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

export function normalizeImageUrl(value: string, baseUrl: string): string | null {
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

export type FetchImageFn = (imageUrl: string) => Promise<
  | { ok: true; buffer: Buffer; mimeType: string; size: number }
  | { ok: false; message: string }
>;

export interface DiskDownloadOptions {
  urls: string[];
  fetchImage: FetchImageFn;
  downloadDir: string;
  workspaceId?: string;
  entityType?: string;
  entityId?: string;
  concurrency: number;
  limit: number;
}

export interface DiskDownloadResult {
  urlToPath: Map<string, string>;
  urlToMime: Map<string, string>;
  total: number;
  downloaded: number;
  skippedCached: number;
  failed: number;
  truncated: number;
  errors: string[];
}

export async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(Math.max(limit, 1), items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await fn(items[index], index);
    }
  });
  await Promise.all(workers);
  return results;
}

function buildImageSubdir(options: { downloadDir: string; workspaceId?: string; entityType?: string; entityId?: string }): string {
  const ws = options.workspaceId || 'default';
  const entity = `${options.entityType || 'item'}_${options.entityId || 'unknown'}`;
  return path.join(options.downloadDir, ws, entity);
}

function hashUrl(url: string): string {
  return crypto.createHash('sha1').update(url).digest('hex').slice(0, 12);
}

async function findCachedFile(dir: string, hash: string): Promise<string | null> {
  try {
    const entries = await fs.readdir(dir);
    const match = entries.find(name => name.startsWith(`${hash}.`));
    return match ? path.join(dir, match) : null;
  } catch {
    return null;
  }
}

export async function downloadImagesToDisk(options: DiskDownloadOptions): Promise<DiskDownloadResult> {
  const urlToPath = new Map<string, string>();
  const urlToMime = new Map<string, string>();
  const errors: string[] = [];
  const capped = options.urls.slice(0, options.limit);
  const truncated = Math.max(0, options.urls.length - capped.length);

  if (capped.length === 0) {
    return { urlToPath, urlToMime, total: options.urls.length, downloaded: 0, skippedCached: 0, failed: 0, truncated, errors };
  }

  const subdir = buildImageSubdir(options);
  await fs.mkdir(subdir, { recursive: true });

  let downloaded = 0;
  let skippedCached = 0;
  let failed = 0;

  await mapWithConcurrency(capped, options.concurrency, async (imageUrl) => {
    const hash = hashUrl(imageUrl);
    const cached = await findCachedFile(subdir, hash);
    if (cached) {
      urlToPath.set(imageUrl, cached);
      urlToMime.set(imageUrl, mimeFromFilePath(cached));
      skippedCached++;
      return;
    }

    const result = await options.fetchImage(imageUrl);
    if (!result.ok) {
      failed++;
      errors.push(`${imageUrl}: ${result.message}`);
      return;
    }

    const ext = extFromMime(result.mimeType);
    const filePath = path.join(subdir, `${hash}.${ext}`);
    await fs.writeFile(filePath, result.buffer);
    urlToPath.set(imageUrl, filePath);
    urlToMime.set(imageUrl, result.mimeType);
    downloaded++;
  });

  return { urlToPath, urlToMime, total: options.urls.length, downloaded, skippedCached, failed, truncated, errors };
}

export function rewriteImageUrlsInText(text: string | undefined | null, baseUrl: string, urlToPath: Map<string, string>): string {
  if (!text || urlToPath.size === 0) return text ?? '';

  const localFor = (rawUrl: string): string | null => {
    const normalized = normalizeImageUrl(rawUrl, baseUrl);
    return normalized ? (urlToPath.get(normalized) ?? null) : null;
  };

  let result = text.replace(/<img\b[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>/gi, (match, rawUrl: string) => {
    const local = localFor(rawUrl);
    return local ? match.replace(rawUrl, local) : match;
  });

  result = result.replace(/!\[[^\]]*\]\(([^\s)]+)(?:\s+"[^"]*")?\)/gi, (match, rawUrl: string) => {
    const local = localFor(rawUrl);
    return local ? match.replace(rawUrl, local) : match;
  });

  result = result.replace(RAW_IMAGE_URL_PATTERN, (match) => localFor(match) ?? match);

  return result;
}

export function rewriteImageUrlsInObject<T>(value: T, baseUrl: string, urlToPath: Map<string, string>): T {
  if (urlToPath.size === 0) return value;
  if (typeof value === 'string') return rewriteImageUrlsInText(value, baseUrl, urlToPath) as unknown as T;
  if (Array.isArray(value)) return value.map(item => rewriteImageUrlsInObject(item, baseUrl, urlToPath)) as unknown as T;
  if (value && typeof value === 'object') {
    const clone: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      clone[key] = rewriteImageUrlsInObject(item, baseUrl, urlToPath);
    }
    return clone as unknown as T;
  }
  return value;
}
