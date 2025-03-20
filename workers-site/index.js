import { getAssetFromKV, NotFoundError } from '@cloudflare/kv-asset-handler';

/**
 * The DEBUG flag will do two things:
 * 1. We will skip caching on the edge, which makes it easier to debug
 * 2. We will return more detailed error messages to the client
 */
const DEBUG = false;

/**
 * Handle SPA routing by serving index.html for all HTML requests
 */
addEventListener('fetch', event => {
  try {
    event.respondWith(handleEvent(event));
  } catch (e) {
    if (DEBUG) {
      return event.respondWith(
        new Response(e.message || e.toString(), {
          status: 500,
        }),
      );
    }
    event.respondWith(new Response('Internal Error', { status: 500 }));
  }
});

async function handleEvent(event) {
  const url = new URL(event.request.url);
  let options = {};

  try {
    // Check if the request is for an asset
    const page = await getAssetFromKV(event, options);
    
    // Allow headers to be modified
    const response = new Response(page.body, page);
    
    // Cache control headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    
    return response;
  } catch (e) {
    // If an error is thrown, handle it
    if (e instanceof NotFoundError) {
      // SPA Fallback - serve index.html for any unmatched routes
      try {
        let notFoundOptions = {
          mapRequestToAsset: req => new Request(`${new URL(req.url).origin}/index.html`, req),
        };
        
        const page = await getAssetFromKV(event, notFoundOptions);
        
        // Return the index page with 200 status
        return new Response(page.body, { 
          ...page, 
          status: 200 
        });
      } catch (e) {
        return new Response('Not Found', { status: 404 });
      }
    } else {
      return new Response('Error serving content', { status: 500 });
    }
  }
} 