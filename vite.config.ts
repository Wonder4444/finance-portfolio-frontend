import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      proxy: {
        // Proxy Yahoo Finance API requests to bypass CORS
        '/yahoo-finance': {
          target: 'https://query1.finance.yahoo.com',
          changeOrigin: true,
          rewrite: (path: string) => path.replace(/^\/yahoo-finance/, ''),
          headers: {
            'User-Agent': 'Mozilla/5.0',
          },
        },
      },
    },
  };
});
