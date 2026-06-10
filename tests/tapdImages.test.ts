import { describe, expect, it, vi } from 'vitest';
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
