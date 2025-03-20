import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';
  
  return {
    plugins: [
      react(),
    ],
    server: {
      proxy: {},
      strictPort: false,
      cors: true,
    },
    preview: {
      port: 5173,
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      // Optimize chunks and asset sizes
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'),
        },
        output: {
          manualChunks: (id) => {
            // Create vendor chunks
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('scheduler') || id.includes('prop-types')) {
                return 'vendor-react';
              }
              if (id.includes('@supabase')) {
                return 'vendor-supabase';
              }
              if (id.includes('react-router')) {
                return 'vendor-router';
              }
              return 'vendor'; // All other dependencies
            }
            return null;
          },
          // Optimize chunk file naming for better caching
          entryFileNames: isProduction 
            ? 'assets/[name].[hash].js' 
            : 'assets/[name].js',
          chunkFileNames: isProduction 
            ? 'assets/[name].[hash].js' 
            : 'assets/[name].js',
          assetFileNames: isProduction 
            ? 'assets/[name].[hash].[ext]' 
            : 'assets/[name].[ext]',
        },
      },
      sourcemap: !isProduction,
      // Enable minification
      minify: isProduction ? 'terser' : false,
      terserOptions: {
        compress: {
          drop_console: isProduction,
          drop_debugger: isProduction,
          pure_funcs: isProduction ? ['console.log', 'console.debug', 'console.info', 'console.warn'] : [],
          global_defs: {
            DEBUG: !isProduction
          },
          passes: 3, // Multiple passes for better minification
          toplevel: true, // Better variable renaming
          unsafe: true, // Enable all unsafe optimizations
          unsafe_math: true,
          unsafe_proto: true,
          unsafe_regexp: true
        },
        format: {
          comments: false, // Remove comments
          ecma: 2020, // Modern JS for better minification
          webkit: true, // Apply WebKit-specific optimizations
          wrap_iife: true, // Wrap IIFEs for safety and smaller size
          ascii_only: true // Use ASCII-only encoding for better compatibility
        },
        mangle: {
          properties: {
            regex: /^_/ // Mangle properties starting with underscore
          }
        }
      },
      // Reduce chunk size
      chunkSizeWarningLimit: 1000,
      // CSS optimization
      cssCodeSplit: true,
      // Output configuration
      target: 'esnext',
    },
    define: {
      // Replace process.env.NODE_ENV but leave other environment variables untouched
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || mode),
      // Disable React DevTools in production - using JSON.stringify for proper syntax
      ...(isProduction && { '__REACT_DEVTOOLS_GLOBAL_HOOK__': JSON.stringify({ isDisabled: true }) }),
    },
    // Optimize development experience
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom']
    },
  };
})
