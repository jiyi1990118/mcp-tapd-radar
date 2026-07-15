import { afterEach, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  downloadImagesToDisk,
  extFromMime,
  mapWithConcurrency,
  rewriteImageUrlsInObject,
  rewriteImageUrlsInText,
} from '../src/utils/imageStorage.js';

const BASE_URL = 'https://api.tapd.cn';

function makeTempDir(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), 'tapd-img-test-'));
}

async function readDirFiles(dir: string): Promise<string[]> {
  const entries: string[] = [];
  async function walk(d: string): Promise<void> {
    const items = await fs.readdir(d, { withFileTypes: true });
    for (const item of items) {
      const full = path.join(d, item.name);
      if (item.isDirectory()) await walk(full);
      else entries.push(full);
    }
  }
  await walk(dir);
  return entries;
}

describe('extFromMime', () => {
  it('maps common image mime types to file extensions', () => {
    expect(extFromMime('image/png')).toBe('png');
    expect(extFromMime('image/jpeg')).toBe('jpg');
    expect(extFromMime('image/gif')).toBe('gif');
    expect(extFromMime('image/webp')).toBe('webp');
  });

  it('falls back to png for unknown mime types', () => {
    expect(extFromMime('image/x-foo')).toBe('png');
  });
});

describe('mapWithConcurrency', () => {
  it('runs items with at most `limit` workers in parallel and preserves order', async () => {
    let active = 0;
    let maxActive = 0;
    const items = Array.from({ length: 10 }, (_, i) => i);
    const order: number[] = [];

    const results = await mapWithConcurrency(items, 3, async (item) => {
      active++;
      maxActive = Math.max(maxActive, active);
      await new Promise(resolve => setTimeout(resolve, 5));
      order.push(item);
      active--;
      return item * 2;
    });

    expect(results).toEqual([0, 2, 4, 6, 8, 10, 12, 14, 16, 18]);
    expect(maxActive).toBeLessThanOrEqual(3);
    expect(order.length).toBe(10);
  });

  it('handles empty input', async () => {
    const results = await mapWithConcurrency([], 5, async (item) => item);
    expect(results).toEqual([]);
  });
});

describe('downloadImagesToDisk', () => {
  it('downloads images in parallel, writes them to disk, and maps URL -> local path', async () => {
    const dir = await makeTempDir();
    const urls = [
      'https://api.tapd.cn/files/a.png',
      'https://api.tapd.cn/files/b.jpg',
    ];
    const fetchImage = vi.fn(async (url: string) => {
      const mime = url.endsWith('.png') ? 'image/png' : 'image/jpeg';
      return { ok: true as const, buffer: Buffer.from(`body-${url}`), mimeType: mime, size: 8 };
    });

    const result = await downloadImagesToDisk({
      urls,
      fetchImage,
      downloadDir: dir,
      workspaceId: 'ws1',
      entityType: 'story',
      entityId: '1001',
      concurrency: 5,
      limit: 50,
    });

    expect(result.total).toBe(2);
    expect(result.downloaded).toBe(2);
    expect(result.failed).toBe(0);
    expect(result.truncated).toBe(0);
    expect(result.urlToPath.size).toBe(2);
    expect(result.urlToMime.size).toBe(2);
    expect(result.urlToMime.get('https://api.tapd.cn/files/a.png')).toBe('image/png');
    expect(result.urlToMime.get('https://api.tapd.cn/files/b.jpg')).toBe('image/jpeg');
    expect(fetchImage).toHaveBeenCalledTimes(2);

    const files = await readDirFiles(dir);
    expect(files.length).toBe(2);
    expect(files.some(f => f.endsWith('.png'))).toBe(true);
    expect(files.some(f => f.endsWith('.jpg'))).toBe(true);

    const savedPath = result.urlToPath.get('https://api.tapd.cn/files/a.png')!;
    const written = await fs.readFile(savedPath);
    expect(written.toString()).toBe('body-https://api.tapd.cn/files/a.png');

    await fs.rm(dir, { recursive: true, force: true });
  });

  it('reuses cached files on subsequent runs without re-downloading', async () => {
    const dir = await makeTempDir();
    const url = 'https://api.tapd.cn/files/cached.png';
    const fetchImage = vi.fn(async () => ({
      ok: true as const,
      buffer: Buffer.from('original'),
      mimeType: 'image/png',
      size: 8,
    }));

    const first = await downloadImagesToDisk({
      urls: [url],
      fetchImage,
      downloadDir: dir,
      workspaceId: 'ws1',
      entityType: 'story',
      entityId: '9',
      concurrency: 1,
      limit: 50,
    });
    expect(first.downloaded).toBe(1);
    expect(first.skippedCached).toBe(0);
    expect(fetchImage).toHaveBeenCalledTimes(1);

    const second = await downloadImagesToDisk({
      urls: [url],
      fetchImage,
      downloadDir: dir,
      workspaceId: 'ws1',
      entityType: 'story',
      entityId: '9',
      concurrency: 1,
      limit: 50,
    });
    expect(second.downloaded).toBe(0);
    expect(second.skippedCached).toBe(1);
    expect(second.urlToPath.get(url)).toBe(first.urlToPath.get(url));
    expect(second.urlToMime.get(url)).toBe('image/png');
    expect(fetchImage).toHaveBeenCalledTimes(1);

    await fs.rm(dir, { recursive: true, force: true });
  });

  it('collects failures without throwing and keeps successful downloads', async () => {
    const dir = await makeTempDir();
    const fetchImage = vi.fn(async (url: string) => {
      if (url.includes('bad')) return { ok: false as const, message: 'HTTP 403' };
      return { ok: true as const, buffer: Buffer.from('ok'), mimeType: 'image/png', size: 2 };
    });

    const result = await downloadImagesToDisk({
      urls: ['https://api.tapd.cn/files/good.png', 'https://api.tapd.cn/files/bad.png'],
      fetchImage,
      downloadDir: dir,
      concurrency: 2,
      limit: 50,
    });

    expect(result.downloaded).toBe(1);
    expect(result.failed).toBe(1);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('bad.png');
    expect(result.errors[0]).toContain('HTTP 403');

    await fs.rm(dir, { recursive: true, force: true });
  });

  it('truncates beyond the limit and leaves the rest unmapped', async () => {
    const dir = await makeTempDir();
    const urls = ['https://api.tapd.cn/files/a.png', 'https://api.tapd.cn/files/b.png', 'https://api.tapd.cn/files/c.png'];
    const fetchImage = vi.fn(async () => ({
      ok: true as const,
      buffer: Buffer.from('x'),
      mimeType: 'image/png',
      size: 1,
    }));

    const result = await downloadImagesToDisk({
      urls,
      fetchImage,
      downloadDir: dir,
      concurrency: 5,
      limit: 2,
    });

    expect(result.truncated).toBe(1);
    expect(result.urlToPath.size).toBe(2);
    expect(fetchImage).toHaveBeenCalledTimes(2);

    await fs.rm(dir, { recursive: true, force: true });
  });

  it('records the real content-type mimeType even when the URL extension differs', async () => {
    const dir = await makeTempDir();
    const url = 'https://api.tapd.cn/files/photo.png';
    const fetchImage = vi.fn(async () => ({
      ok: true as const,
      buffer: Buffer.from('webp-bytes'),
      mimeType: 'image/webp',
      size: 10,
    }));

    const result = await downloadImagesToDisk({
      urls: [url],
      fetchImage,
      downloadDir: dir,
      concurrency: 1,
      limit: 50,
    });

    expect(result.urlToMime.get(url)).toBe('image/webp');
    const localPath = result.urlToPath.get(url)!;
    expect(localPath.endsWith('.webp')).toBe(true);
    expect(localPath.endsWith('.png')).toBe(false);

    await fs.rm(dir, { recursive: true, force: true });
  });
});

describe('rewriteImageUrlsInText', () => {
  it('replaces html img src, markdown image urls, and raw urls with local paths', () => {
    const urlToPath = new Map<string, string>([
      ['https://api.tapd.cn/files/a.png', '/local/a.png'],
      ['https://api.tapd.cn/files/b.jpg', '/local/b.jpg'],
    ]);

    const text = '<img src="https://api.tapd.cn/files/a.png"> see ![](https://api.tapd.cn/files/b.jpg) and raw https://api.tapd.cn/files/a.png again';
    const rewritten = rewriteImageUrlsInText(text, BASE_URL, urlToPath);

    expect(rewritten).toContain('src="/local/a.png"');
    expect(rewritten).toContain('![](/local/b.jpg)');
    expect(rewritten).not.toContain('api.tapd.cn/files/a.png');
    expect(rewritten).not.toContain('api.tapd.cn/files/b.jpg');
  });

  it('leaves unmapped urls untouched', () => {
    const urlToPath = new Map<string, string>([
      ['https://api.tapd.cn/files/a.png', '/local/a.png'],
    ]);
    const text = '<img src="https://api.tapd.cn/files/a.png"> <img src="https://api.tapd.cn/files/other.png">';
    const rewritten = rewriteImageUrlsInText(text, BASE_URL, urlToPath);
    expect(rewritten).toContain('src="/local/a.png"');
    expect(rewritten).toContain('https://api.tapd.cn/files/other.png');
  });

  it('returns the original text when the map is empty', () => {
    const text = '<img src="https://api.tapd.cn/files/a.png">';
    expect(rewriteImageUrlsInText(text, BASE_URL, new Map())).toBe(text);
  });
});

describe('rewriteImageUrlsInObject', () => {
  it('rewrites description strings nested in objects and arrays', () => {
    const urlToPath = new Map<string, string>([
      ['https://api.tapd.cn/files/a.png', '/local/a.png'],
    ]);
    const obj = {
      description: '<img src="https://api.tapd.cn/files/a.png">',
      children: [{ description: '![](https://api.tapd.cn/files/a.png)' }],
    };
    const rewritten = rewriteImageUrlsInObject(obj, BASE_URL, urlToPath);
    expect(rewritten.description).toContain('/local/a.png');
    expect(rewritten.children[0].description).toContain('/local/a.png');
  });

  it('does not mutate the original object', () => {
    const urlToPath = new Map<string, string>([
      ['https://api.tapd.cn/files/a.png', '/local/a.png'],
    ]);
    const obj = { description: '<img src="https://api.tapd.cn/files/a.png">' };
    const rewritten = rewriteImageUrlsInObject(obj, BASE_URL, urlToPath);
    expect(obj.description).toContain('api.tapd.cn');
    expect(rewritten.description).toContain('/local/a.png');
  });
});
