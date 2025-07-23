import path from "path"
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env variables based on the current mode (development | production | etc.)
  // We load **all** env vars (no prefix filter) so that we can access VITE_PORT here.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      // Use the port from the `.env` file if provided, otherwise fall back to 8501.
      port: env.VITE_PORT ? parseInt(env.VITE_PORT) : 8501,
      // Expose the dev server on all network interfaces so that it can be accessed
      // from outside a Docker container or over the local network.
      host: true,
      allowedHosts: true
    },
    optimizeDeps: {
      esbuildOptions: {
        // Node.js global to browser globalThis
        define: {
          global: 'globalThis'
        },
        // Enable esbuild polyfill plugins
        plugins: [
          NodeGlobalsPolyfillPlugin({
            buffer: true
          })
        ]
      }
    }
  };
});
