import { getAssetFromKV, NotFoundError } from '@cloudflare/kv-asset-handler';

/**
 * The DEBUG flag will do two things:
 * 1. We will skip caching on the edge, which makes it easier to debug
 * 2. We will return more detailed error messages to the client
 */
const DEBUG = false;

// HTML rewriter to inject environment variables into the index.html
class EnvInjector {
  constructor(env) {
    this.env = env;
  }
  
  element(element) {
    // Add environment variables to a script tag
    // Only expose the minimum necessary information
    const scriptContent = `
      window.ENV = {
        SUPABASE_URL: "${this.env.SUPABASE_URL || ''}",
        SUPABASE_ANON_KEY: "${this.env.SUPABASE_ANON_KEY || ''}",
        PAYSTACK_PUBLIC_KEY: "${this.env.PAYSTACK_PUBLIC_KEY || ''}"
      };
    `;
    
    // Append script to head
    element.append(`<script>${scriptContent}</script>`, { html: true });
  }
}

// Script rewriter to replace placeholder values with actual values
class PlaceholderReplacer {
  constructor(env) {
    this.env = env;
    this.placeholders = {
      __RUNTIME_SUPABASE_URL__: this.env.SUPABASE_URL || '',
      __RUNTIME_SUPABASE_ANON_KEY__: this.env.SUPABASE_ANON_KEY || '',
      __RUNTIME_PAYSTACK_PUBLIC_KEY__: this.env.PAYSTACK_PUBLIC_KEY || '',
    };
  }
  
  element(element) {
    // Don't modify script elements
  }
  
  text(text) {
    let content = text.text;
    
    // Replace placeholders with actual values
    for (const [placeholder, value] of Object.entries(this.placeholders)) {
      content = content.replace(new RegExp(placeholder, 'g'), value);
    }
    
    text.replace(content);
  }
}

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

  // Add caching options for production
  if (!DEBUG) {
    options.cacheControl = {
      browserTTL: 60 * 60 * 24, // 1 day
      edgeTTL: 60 * 60 * 24 * 7, // 7 days
      bypassCache: false,
    };
  }

  try {
    // Check if the request is for an asset
    const page = await getAssetFromKV(event, options);
    
    // Create the response
    const response = new Response(page.body, page);
    
    // Add security headers to all responses
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    
    // Get content type
    const contentType = response.headers.get('content-type') || '';
    
    // For HTML documents
    if (contentType.includes('text/html')) {
      // For index.html, inject environment variables as window.ENV
      if (url.pathname === '/' || url.pathname === '/index.html') {
        return new HTMLRewriter()
          .on('head', new EnvInjector(event.env))
          .transform(response);
      }
    }
    // For JavaScript assets, replace placeholders with env values
    else if (contentType.includes('javascript')) {
      return new HTMLRewriter()
        .on('*', new PlaceholderReplacer(event.env))
        .transform(response);
    }
    
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
        
        // Return the index page with 200 status and inject environment variables
        const response = new Response(page.body, { 
          ...page, 
          status: 200 
        });
        
        // Add security headers
        response.headers.set('X-Content-Type-Options', 'nosniff');
        response.headers.set('X-Frame-Options', 'DENY');
        response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
        response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
        
        // Inject environment variables
        return new HTMLRewriter()
          .on('head', new EnvInjector(event.env))
          .transform(response);
      } catch (e) {
        return new Response('Not Found', { status: 404 });
      }
    } else {
      return new Response('Error serving content', { status: 500 });
    }
  }
} 