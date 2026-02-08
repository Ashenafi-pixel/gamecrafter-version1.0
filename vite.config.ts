import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import forceReload from './force-reload.js';
import path from 'path';

export default defineConfig({
  plugins: [react(), forceReload()],
  resolve: {
    alias: [
      { find: '@rollup/rollup-linux-x64-gnu', replacement: path.resolve(__dirname, 'emptyModule.js') },
      { find: '@rollup/rollup-win32-x64-msvc', replacement: path.resolve(__dirname, 'emptyModule.js') }
    ],
    dedupe: ['react', 'react-dom']
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
    include: ['react', 'react-dom', 'react-router-dom', 'react/jsx-dev-runtime'],
    force: true,
    esbuildOptions: {
      target: 'es2020'
    }
  },
  // Disable caching to always serve fresh content
  cacheDir: '.vite-cache',
  appType: 'spa',

  build: {
    chunkSizeWarningLimit: 1000,
    assetsDir: 'assets',
    manifest: true,
    sourcemap: false, // Disable sourcemaps to reduce memory usage
    rollupOptions: {
      treeshake: true, // Enable tree shaking to reduce bundle size
      input: {
        main: path.resolve(__dirname, 'index.html')
      },
      output: {
        entryFileNames: `assets/[name].[hash].js`,
        chunkFileNames: `assets/[name].[hash].js`,
        assetFileNames: `assets/[name].[hash].[ext]`,
        // manualChunks: (id) => {
        //   // Enhanced chunking strategy for React 19 optimization
        //   if (id.includes('node_modules')) {
        //     // React core libraries
        //     if (id.includes('react') || id.includes('react-dom')) {
        //       return 'react-vendor';
        //     }
        //     // Animation libraries
        //     if (id.includes('pixi.js') || id.includes('gsap')) {
        //       return 'animation-libs';
        //     }
        //     // Icon libraries
        //     if (id.includes('lucide-react')) {
        //       return 'icons';
        //     }
        //     // Router
        //     if (id.includes('react-router')) {
        //       return 'router';
        //     }
        //     // Other vendors
        //     return 'vendor';
        //   }
        //   // Application code splitting
        //   if (id.includes('/animation-lab/')) {
        //     return 'animation-lab';
        //   }
        //   if (id.includes('/components/') && id.includes('Enhanced')) {
        //     return 'enhanced-components';
        //   }
        // }
      },
      external: [
        '/EMERGENCY-CLEANUP.js',
        '/SAFE-MEGA-LOGGER.js',
        '/BLANK-SCREEN-FIX.js',
        '/EARLY-EMERGENCY-NAV.js',
        '/EMERGENCY-FORCE-NAVFIX.js',
        '/navigation-fix.js',
        '/step1to2-fix.js',
        '/emergency-big-button.js',
        '/emergency-nav.js'
      ]
    }
  },
  server: {
    port: 5173,
    host: true, // Add this to allow external access
    hmr: {
      overlay: true,
    },
    watch: {
      usePolling: true,
      interval: 100,
    },
    proxy: {
      '/.netlify/functions': {
        target: 'http://localhost:9999',
        changeOrigin: true,
        secure: false,
        ws: true, // Enable WebSocket proxy
      },
      // Specific route for RGS
      '/api/rgs': {
        target: 'http://localhost:3500',
        changeOrigin: true,
        secure: false,
      },
      // General API fallback (must be after specific /api routes)
      '/api': {
        target: 'http://localhost:3500',
        changeOrigin: true,
        secure: false,
      },
      '/api/fooocus': {
        target: process.env.FOOOCUS_API_URL || 'http://localhost:8888',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/fooocus/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('Origin', 'http://localhost:5173');
          });
        }
      },
      '/game-assets': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false
      },
      '/saved-images': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false
      },
      '/save-image': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false
      },
      '/create-folders': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false
      }
    },
    cors: true // Enable CORS for all routes
  }
});