import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env so we can read VITE_SETU_BASE_URL for the proxy target
  const env = loadEnv(mode, process.cwd(), '');
  const setuBase = env.VITE_SETU_BASE_URL || 'https://fiu-sandbox.setu.co';

  return {
    plugins: [react()],

    server: {
      proxy: {
        // All requests to /api/setu/* are proxied to the Setu AA sandbox.
        // This solves the CORS problem: the browser calls localhost,
        // Vite forwards it server-side to Setu, Setu replies to Vite,
        // Vite replies to the browser. No CORS headers needed.
        '/api/setu': {
          target:      setuBase,
          changeOrigin: true,
          secure:      true,
          rewrite:     path => path.replace(/^\/api\/setu/, ''),
          configure:   (proxy) => {
            proxy.on('error', (err) => {
              console.warn('[Setu proxy error]', err.message);
            });
          },
        },
      },
    },

    // Same proxy config for preview builds
    preview: {
      proxy: {
        '/api/setu': {
          target:      setuBase,
          changeOrigin: true,
          secure:      true,
          rewrite:     path => path.replace(/^\/api\/setu/, ''),
        },
      },
    },
  };
});
