import { test, expect } from '@playwright/test';

test.describe('MusicNest Smoke Tests', () => {
  test('homepage returns HTTP 200', async ({ request }) => {
    const res = await request.get('/');
    expect(res.status()).toBe(200);
  });

  test('homepage contains proper Open Graph, Twitter, and Favicon metadata', async ({ request }) => {
    const res = await request.get('/');
    expect(res.status()).toBe(200);
    const html = await res.text();
    expect(html).toContain('property="og:title"');
    expect(html).toContain('name="twitter:card"');
    expect(html).toContain('name="theme-color"');
    expect(html).toContain('icon.svg');
  });

  test('/api/search returns valid JSON structure', async ({ request }) => {
    const res = await request.get('/api/search?q=a');
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty('artists');
    expect(json).toHaveProperty('albums');
    expect(json).toHaveProperty('songs');
    expect(Array.isArray(json.artists)).toBe(true);
    expect(Array.isArray(json.albums)).toBe(true);
    expect(Array.isArray(json.songs)).toBe(true);
  });

  test('/api/stream/[id] handles requests with range or returns 404 for missing song', async ({ request }) => {
    const res = await request.get('/api/stream/999999999', {
      headers: { Range: 'bytes=0-1024' },
    });
    // Menghasilkan 404 untuk ID acak tanpa crash 500
    expect([200, 206, 404]).toContain(res.status());
    if (res.status() === 404) {
      const data = await res.json();
      expect(data).toHaveProperty('error');
    }
  });
});
