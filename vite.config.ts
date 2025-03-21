import { defineConfig, PluginOption } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import obfuscator from 'rollup-plugin-obfuscator'
import fs from 'fs'
import dotenv from 'dotenv'

// Load .env file
const env = dotenv.parse(fs.readFileSync('.env'))

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';
  
  // Create plugins array with proper type checking
  const plugins: PluginOption[] = [react()];
  
  // Add obfuscator only in production
  if (isProduction) {
    plugins.push(obfuscator({
      options: {
        compact: true,
        controlFlowFlattening: true,
        controlFlowFlatteningThreshold: 0.75,
        deadCodeInjection: true,
        deadCodeInjectionThreshold: 0.4,
        debugProtection: true,
        debugProtectionInterval: 4000,
        disableConsoleOutput: true,
        identifierNamesGenerator: 'hexadecimal',
        log: false,
        numbersToExpressions: true,
        renameGlobals: false,
        selfDefending: true,
        simplify: true,
        splitStrings: true,
        splitStringsChunkLength: 10,
        stringArray: true,
        stringArrayCallsTransform: true,
        stringArrayCallsTransformThreshold: 0.75,
        stringArrayEncoding: ['base64'],
        stringArrayIndexShift: true,
        stringArrayRotate: true,
        stringArrayShuffle: true,
        stringArrayWrappersCount: 2,
        stringArrayWrappersChainedCalls: true,
        stringArrayWrappersParametersMaxCount: 4,
        stringArrayWrappersType: 'function',
        stringArrayThreshold: 0.75,
        transformObjectKeys: true,
        unicodeEscapeSequence: false
      }
    }) as PluginOption);
  }
  
  return {
    plugins,
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
      // Include env variables directly in the build
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
      'import.meta.env.VITE_PAYSTACK_PUBLIC_KEY': JSON.stringify(env.VITE_PAYSTACK_PUBLIC_KEY),
      // Set MODE and PROD values explicitly for production
      ...(isProduction && {
        'import.meta.env.MODE': JSON.stringify('production'),
        'import.meta.env.PROD': 'true',
        'import.meta.env.DEV': 'false'
      })
    },
    // Optimize development experience
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom']
    },
  };
})
