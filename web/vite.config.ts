import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "src") } },
  publicDir: false,
  build: { outDir: "../api/public", emptyOutDir: false, assetsDir: "assets" },
  server: {
    proxy: {
      "/v1": {
        target: "https://markbase-api.spreadsheets600.workers.dev",
        changeOrigin: true,
      },
    },
  },
});
