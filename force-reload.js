// Vite plugin to force browser to reload and clear cache
export default function forceReload() {
  const timestamp = Date.now();
  
  return {
    name: 'vite-plugin-force-reload',
    
    // Add build timestamp to index.html
    transformIndexHtml(html) {
      return html.replace(
        '</head>',
        `<script>window.BUILD_TIMESTAMP = ${timestamp};</script></head>`
      );
    },
    
    // Add query string to all assets in dev mode
    configureServer(server) {
      return () => {
        server.middlewares.use((req, res, next) => {
          // Add Cache-Control headers to prevent caching
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
          next();
        });
      };
    }
  };
}
