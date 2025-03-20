import { getAssetFromKV, NotFoundError } from '@cloudflare/kv-asset-handler';

/**
 * The DEBUG flag will do two things:
 * 1. We will skip caching on the edge, which makes it easier to debug
 * 2. We will return more detailed error messages to the client
 */
const DEBUG = true; // Enable debug mode temporarily to catch errors

// HTML rewriter to inject environment variables into the index.html
class EnvInjector {
  constructor(env) {
    this.env = env || {};
  }
  
  element(element) {
    try {
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
    } catch (error) {
      console.error('Error in EnvInjector:', error);
    }
  }
}

// Script rewriter to replace placeholder values with actual values
class PlaceholderReplacer {
  constructor(env) {
    this.env = env || {};
    this.placeholders = {
      __RUNTIME_SUPABASE_URL__: this.env.SUPABASE_URL || '',
      __RUNTIME_SUPABASE_ANON_KEY__: this.env.SUPABASE_ANON_KEY || '',
      __RUNTIME_PAYSTACK_PUBLIC_KEY__: this.env.PAYSTACK_PUBLIC_KEY || '',
    };
  }
  
  element(element) {
    // Don't modify elements
  }
  
  text(text) {
    try {
      let content = text.text;
      
      // Replace placeholders with actual values
      for (const [placeholder, value] of Object.entries(this.placeholders)) {
        if (content.includes(placeholder)) {
          content = content.replace(new RegExp(placeholder, 'g'), value);
        }
      }
      
      text.replace(content);
    } catch (error) {
      console.error('Error in PlaceholderReplacer:', error);
    }
  }
}

/**
 * Handle SPA routing by serving index.html for all HTML requests
 */
addEventListener('fetch', event => {
  try {
    event.respondWith(handleEvent(event));
  } catch (e) {
    console.error('Top-level error:', e);
    return event.respondWith(
      new Response('Internal Error: ' + (DEBUG ? e.message || e.toString() : ''), { 
        status: 500,
        headers: {
          'Content-Type': 'text/html'
        }
      })
    );
  }
});

async function handleEvent(event) {
  try {
    const url = new URL(event.request.url);
    let options = {};

    // Add caching options for production
    if (!DEBUG) {
      options.cacheControl = {
        browserTTL: 60 * 60 * 24, // 1 day
        edgeTTL: 60 * 60 * 24 * 7, // 7 days
        bypassCache: false,
      };
    } else {
      // In debug mode, bypass cache
      options.cacheControl = {
        bypassCache: true,
      };
    }

    // Check if we can access environment vars
    const envVars = {
      SUPABASE_URL: event.env?.SUPABASE_URL || '',
      SUPABASE_ANON_KEY: event.env?.SUPABASE_ANON_KEY || '',
      PAYSTACK_PUBLIC_KEY: event.env?.PAYSTACK_PUBLIC_KEY || ''
    };
    
    console.log('Environment variables available:', 
      !!envVars.SUPABASE_URL, 
      !!envVars.SUPABASE_ANON_KEY,
      !!envVars.PAYSTACK_PUBLIC_KEY
    );

    // Check if request is for the root path or index.html
    if (url.pathname === '/' || url.pathname === '/index.html') {
      try {
        // Get the index page
        const page = await getAssetFromKV(event, {
          ...options,
          mapRequestToAsset: req => new Request(`${new URL(req.url).origin}/index.html`, req)
        });
        
        // Create response and add security headers
        const response = new Response(page.body, page);
        addSecurityHeaders(response);
        
        // Inject environment variables
        return new HTMLRewriter()
          .on('head', new EnvInjector(envVars))
          .transform(response);
      } catch (error) {
        console.error('Error serving index.html:', error);
        throw error;
      }
    }
    
    // Handle JavaScript files
    if (url.pathname.endsWith('.js')) {
      try {
        const page = await getAssetFromKV(event, options);
        const response = new Response(page.body, page);
        addSecurityHeaders(response);
        
        return new HTMLRewriter()
          .on('*', new PlaceholderReplacer(envVars))
          .transform(response);
      } catch (error) {
        console.error('Error serving JavaScript:', error);
        throw error;
      }
    }
    
    // Handle all other assets normally
    try {
      const page = await getAssetFromKV(event, options);
      const response = new Response(page.body, page);
      addSecurityHeaders(response);
      return response;
    } catch (e) {
      // If not a static asset, serve the index.html (SPA fallback)
      if (e instanceof NotFoundError) {
        // Return index.html for any route
        try {
          const page = await getAssetFromKV(event, {
            ...options,
            mapRequestToAsset: req => new Request(`${new URL(req.url).origin}/index.html`, req),
          });
          
          const response = new Response(page.body, { 
            ...page, 
            status: 200 
          });
          
          addSecurityHeaders(response);
          
          return new HTMLRewriter()
            .on('head', new EnvInjector(envVars))
            .transform(response);
        } catch (indexError) {
          console.error('Error serving SPA fallback:', indexError);
          return new Response('Not Found', { status: 404 });
        }
      }
      
      // Rethrow other errors
      throw e;
    }
  } catch (error) {
    console.error('Error in handleEvent:', error);
    
    // Return a friendly error page instead of a blank page
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Error</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; padding: 2rem; max-width: 600px; margin: 0 auto; }
            h1 { color: #DC2626; }
            pre { background: #f1f1f1; padding: 1rem; border-radius: 0.5rem; overflow: auto; }
          </style>
        </head>
        <body>
          <h1>Application Error</h1>
          <p>The application encountered an error. Please try again later.</p>
          ${DEBUG ? `<pre>${error.stack || error.message || 'Unknown error'}</pre>` : ''}
        </body>
      </html>
    `, { 
      status: 500,
      headers: {
        'Content-Type': 'text/html'
      }
    });
  }
}

// Helper function to add security headers
function addSecurityHeaders(response) {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
} 