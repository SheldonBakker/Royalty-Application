// Cloudflare Pages middleware to inject environment variables
export async function onRequest({ request, env, next }) {
  // Process the request through the next handler
  const response = await next();
  
  // Only modify HTML responses
  if (response.headers.get("content-type")?.includes("text/html")) {
    // Clone the response and get its text
    const originalText = await response.clone().text();
    
    // Create script to inject environment variables
    const injectedScript = `
      <script>
        window.CLOUDFLARE = true;
        window.__ENV = window.__ENV || {};
        window.__ENV.VITE_SUPABASE_URL = "${env.VITE_SUPABASE_URL || ''}";
        window.__ENV.VITE_SUPABASE_ANON_KEY = "${env.VITE_SUPABASE_ANON_KEY || ''}";
        window.__ENV.VITE_PAYSTACK_PUBLIC_KEY = "${env.VITE_PAYSTACK_PUBLIC_KEY || ''}";
        console.log('Cloudflare environment variables injected');
      </script>
    `;
    
    // Insert the script right after the opening head tag
    const modifiedText = originalText.replace('<head>', '<head>' + injectedScript);
    
    // Return a new response with the modified HTML
    return new Response(modifiedText, {
      headers: response.headers
    });
  }
  
  // Return the original response for non-HTML requests
  return response;
} 