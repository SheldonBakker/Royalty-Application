/**
 * Utility to disable developer tools and console logs in production
 */

export function disableDevTools(): void {
  // Check if we're in production mode
  // Safely check if import.meta.env exists first
  const isProduction = 
    typeof import.meta !== 'undefined' && 
    import.meta.env && 
    (import.meta.env.PROD === true || import.meta.env.MODE === 'production');
  
  // Production-only features
  if (isProduction) {
    // Disable console methods
    const noop = (): void => {};
    
    // Replace with no-op functions
    console.log = noop;
    console.warn = noop;
    console.info = noop;
    console.debug = noop;
    
    // Keep error and trace for critical issues
    // console.error and console.trace remain functional
    
    // Prevent use of development tools
    window.addEventListener('keydown', (e) => {
      // Prevent F12, Ctrl+Shift+I, Cmd+Option+I
      if (
        e.key === 'F12' || 
        (e.ctrlKey && e.shiftKey && e.key === 'I') || 
        (e.metaKey && e.altKey && e.key === 'I')
      ) {
        e.preventDefault();
      }
    });
  }
  
  // Features enabled in all environments (including development)
  
  // Disable right-click/context menu across the entire application
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    return false;
  });
} 