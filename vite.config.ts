import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  return {
    plugins: [react(), tailwindcss()],
    define: {
      "process.env.GEMINI_API_KEY": JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== "true",
      proxy: {
        // Proxy local backend API requests
        "/finance-portfolio": {
          target: "http://localhost:8080",
          changeOrigin: true,
        },
        // Proxy Yahoo Finance API requests to bypass CORS
        "/yahoo-finance": {
          target: "https://query1.finance.yahoo.com",
          changeOrigin: true,
          rewrite: (path: string) => path.replace(/^\/yahoo-finance/, ""),
          headers: {
            "User-Agent": "Mozilla/5.0",
          },
        },
        // Proxy Yahoo Finance RSS (finance.yahoo.com domain) to avoid browser CORS
        "/yahoo-rss": {
          target: "https://finance.yahoo.com",
          changeOrigin: true,
          rewrite: (path: string) => path.replace(/^\/yahoo-rss/, ""),
          headers: {
            "User-Agent": "Mozilla/5.0",
          },
        },
      },
    },
  };
});
