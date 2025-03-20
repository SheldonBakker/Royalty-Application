import { getAssetFromKV } from '@cloudflare/kv-asset-handler';

// Define options for asset handling
const options = {
  // You can customize caching behavior here
  cacheControl: {
    // Default browser cache TTL in seconds
    browserTTL: 60 * 60 * 24, // 24 hours
    // Default edge cache TTL in seconds
    edgeTTL: 60 * 60 * 24 * 30, // 30 days
    // Custom cache settings for specific file types
    byContentType: {
      'text/html': {
        browserTTL: 60 * 60 * 2, // 2 hours for HTML
        edgeTTL: 60 * 60 * 24, // 24 hours
      },
    },
  },
};

async function handleEvent(event) {
  const url = new URL(event.request.url);
  
  try {
    // Serve static assets from KV storage
    return await getAssetFromKV(event, options);
  } catch (e) {
    // If the requested resource isn't found, or an error occurs:
    return new Response(`Not found: ${url.pathname}`, {
      status: 404,
      statusText: 'Not Found',
    });
  }
}

addEventListener('fetch', (event) => {
  event.respondWith(handleEvent(event));
}); 