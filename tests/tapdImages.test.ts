import { describe, expect, it, vi } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { buildTapdDetailContent, downloadTapdImage, extractImageUrls } from '../src/utils/tapdImages.js';

describe('extractImageUrls', () => {
  it('extracts and normalizes image URLs from HTML, markdown, and raw text', () => {
    const text = `
      <p><img src="/images/prototype.png" alt="prototype"></p>
      ![mockup](https://api.tapd.cn/files/mockup.jpg?token=abc)
      see https://api.tapd.cn/files/screenshot.webp for details
      duplicate https://api.tapd.cn/files/screenshot.webp
      ignore https://api.tapd.cn/files/readme.txt
    `;

    expect(extractImageUrls(text, 'https://api.tapd.cn')).toEqual([
      'https://api.tapd.cn/images/prototype.png',
      'https://api.tapd.cn/files/mockup.jpg?token=abc',
      'https://api.tapd.cn/files/screenshot.webp',
    ]);
  });

  it('returns an empty array when no image URLs are present', () => {
    expect(extractImageUrls('plain requirement text', 'https://api.tapd.cn')).toEqual([]);
  });

  it('extracts extensionless TAPD image URLs from image markup', () => {
    const text = '<img src="https://api.tapd.cn/tfl/image/preview?id=123"> ![prototype](/tfl/image/456)';

    expect(extractImageUrls(text, 'https://api.tapd.cn')).toEqual([
      'https://api.tapd.cn/tfl/image/preview?id=123',
      'https://api.tapd.cn/tfl/image/456',
    ]);
  });
});

describe('downloadTapdImage', () => {
  it('resolves TAPD image paths through /files/get_image before downloading', async () => {
    const body = new Uint8Array([4, 5, 6]).buffer;
    const fetcher = vi.fn(async (input: string | URL | Request) => {
      const url = input.toString();
      if (url.startsWith('https://api.tapd.cn/files/get_image?')) {
        return Response.json({
          status: 1,
          data: {
            Attachment: {
              download_url: 'https://file.tapd.cn/attachments/tmp_download/signed?salt=abc&time=123',
            },
          },
          info: 'success',
        });
      }

      return new Response(body, {
        status: 200,
        headers: { 'content-type': 'image/png' },
      });
    });

    const result = await downloadTapdImage(
      'https://file.tapd.cn//tfl/captures/2026-06/tapd_48801209_base64_1780282853_330.png',
      'access-token',
      fetcher,
      { apiBaseUrl: 'https://api.tapd.cn', workspaceId: '48801209' },
    );

    expect(fetcher).toHaveBeenNthCalledWith(1, 'https://api.tapd.cn/files/get_image?workspace_id=48801209&image_path=%2Ftfl%2Fcaptures%2F2026-06%2Ftapd_48801209_base64_1780282853_330.png', {
      headers: { Authorization: 'Bearer access-token' },
    });
    expect(fetcher).toHaveBeenNthCalledWith(2, 'https://file.tapd.cn/attachments/tmp_download/signed?salt=abc&time=123', {
      headers: {},
      redirect: 'follow',
    });
    expect(result).toEqual({
      ok: true,
      content: {
        type: 'image',
        data: Buffer.from(body).toString('base64'),
        mimeType: 'image/png',
      },
      size: 3,
      mimeType: 'image/png',
    });
  });

  it('accepts TAPD temporary downloads that return non-standard image content type', async () => {
    const body = new Uint8Array([7, 8]).buffer;
    const fetcher = vi.fn(async () => new Response(body, {
      status: 200,
      headers: { 'content-type': 'image' },
    }));

    const result = await downloadTapdImage('https://file.tapd.cn/attachments/tmp_download/prototype.png', 'access-token', fetcher);

    expect(result).toEqual({
      ok: true,
      content: {
        type: 'image',
        data: Buffer.from(body).toString('base64'),
        mimeType: 'image/png',
      },
      size: 2,
      mimeType: 'image/png',
    });
  });

  it('downloads an authenticated image and returns MCP image content', async () => {
    const body = new Uint8Array([1, 2, 3]).buffer;
    const fetcher = vi.fn(async () => new Response(body, {
      status: 200,
      headers: { 'content-type': 'image/png' },
    }));

    const result = await downloadTapdImage('https://api.tapd.cn/files/prototype.png', 'access-token', fetcher);

    expect(fetcher).toHaveBeenCalledWith('https://api.tapd.cn/files/prototype.png', {
      headers: { Authorization: 'Bearer access-token' },
      redirect: 'follow',
    });
    expect(result).toEqual({
      ok: true,
      content: {
        type: 'image',
        data: Buffer.from(body).toString('base64'),
        mimeType: 'image/png',
      },
      size: 3,
      mimeType: 'image/png',
    });
  });

  it('reports non-image responses without throwing', async () => {
    const fetcher = vi.fn(async () => new Response('login required', {
      status: 200,
      headers: { 'content-type': 'text/html' },
    }));

    const result = await downloadTapdImage('https://api.tapd.cn/files/prototype.png', 'access-token', fetcher);

    expect(result).toEqual({
      ok: false,
      message: 'URL did not return an image. Content-Type: text/html. Response: login required',
    });
  });
});

describe('buildTapdDetailContent', () => {
  it('returns JSON detail, image URL summary, and downloaded images up to the limit', async () => {
    const fetcher = vi.fn(async () => new Response(new Uint8Array([9]).buffer, {
      status: 200,
      headers: { 'content-type': 'image/jpeg' },
    }));
    const story = {
      id: '1001',
      name: 'Prototype review',
      description: '<img src="/files/a.jpg"><img src="/files/b.png">',
    };

    const content = await buildTapdDetailContent(story, {
      baseUrl: 'https://api.tapd.cn',
      getToken: async () => 'access-token',
      fetcher,
      autoDownloadLimit: 1,
      workspaceId: '48801209',
    });

    expect(content).toHaveLength(2);
    expect(content[0]).toMatchObject({ type: 'text' });
    expect(content[0].type === 'text' ? content[0].text : '').toContain('"image_urls"');
    expect(content[0].type === 'text' ? content[0].text : '').toContain('Only the first 1 image(s) were downloaded automatically');
    expect(content[1]).toEqual({
      type: 'image',
      data: Buffer.from(new Uint8Array([9]).buffer).toString('base64'),
      mimeType: 'image/jpeg',
    });
  });
});

describe('buildTapdDetailContent (disk mode)', () => {
  it('downloads images in parallel, returns only text (no base64), and rewrites description URLs to local paths', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'tapd-disk-'));
    const fetcher = vi.fn(async (input: string | URL | Request) => {
      const url = input.toString();
      const mime = url.includes('.png') ? 'image/png' : 'image/jpeg';
      return new Response(new Uint8Array([1, 2, 3]).buffer, {
        status: 200,
        headers: { 'content-type': mime },
      });
    });

    const story = {
      Story: {
        id: '1001',
        name: 'Prototype review',
        description: '<img src="https://api.tapd.cn/files/a.png"><img src="https://api.tapd.cn/files/b.jpg">',
      },
    };

    const content = await buildTapdDetailContent(story, {
      baseUrl: 'https://api.tapd.cn',
      getToken: async () => 'access-token',
      fetcher,
      workspaceId: '48801209',
      saveToDisk: true,
      downloadDir: dir,
      downloadLimit: 50,
      concurrency: 5,
    });

    // No base64 image content blocks - only a single text block.
    expect(content).toHaveLength(1);
    expect(content[0].type).toBe('text');
    const text = content[0].type === 'text' ? content[0].text : '';
    const parsed = JSON.parse(text);

    expect(parsed.image_resources.mode).toBe('disk');
    expect(parsed.image_resources.downloaded).toBe(2);
    expect(parsed.image_resources.failed).toBe(0);
    expect(parsed.data.item.description).not.toContain('api.tapd.cn/files/a.png');
    expect(parsed.data.item.description).toContain(dir);
    // raw keeps all fields AND also has URLs rewritten to local paths (same as item).
    expect(parsed.raw.Story.description).not.toContain('api.tapd.cn/files/a.png');
    expect(parsed.raw.Story.description).toContain(dir);

    // Both images should exist on disk.
    const localA = parsed.data.item.description.match(/src="([^"]+a[^"]*\.png)"/)?.[1];
    const localB = parsed.data.item.description.match(/src="([^"]+b[^"]*\.jpg)"/)?.[1];
    expect(localA).toBeTruthy();
    expect(localB).toBeTruthy();
    await expect(fs.access(localA!)).resolves.toBeUndefined();
    await expect(fs.access(localB!)).resolves.toBeUndefined();

    await fs.rm(dir, { recursive: true, force: true });
  });

  it('returns only text with failure reports when downloads fail', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'tapd-disk-'));
    const fetcher = vi.fn(async () => new Response('forbidden', {
      status: 403,
      headers: { 'content-type': 'text/html' },
    }));

    const story = {
      Story: {
        id: '1001',
        name: 'x',
        description: '<img src="https://api.tapd.cn/files/a.png">',
      },
    };

    const content = await buildTapdDetailContent(story, {
      baseUrl: 'https://api.tapd.cn',
      getToken: async () => 'access-token',
      fetcher,
      workspaceId: '48801209',
      saveToDisk: true,
      downloadDir: dir,
      downloadLimit: 50,
      concurrency: 2,
    });

    expect(content).toHaveLength(1);
    const parsed = JSON.parse(content[0].type === 'text' ? content[0].text : '');
    expect(parsed.image_resources.failed).toBe(1);
    expect(parsed.image_resources.errors).toHaveLength(1);
    // URL left as remote in the description.
    expect(parsed.data.item.description).toContain('api.tapd.cn/files/a.png');

    await fs.rm(dir, { recursive: true, force: true });
  });
});
