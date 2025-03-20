/**
 * Utility to disable developer tools and console logs in production
 */

export function disableDevTools(): void {
  // Production-only features
  if (process.env.NODE_ENV === 'production') {
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