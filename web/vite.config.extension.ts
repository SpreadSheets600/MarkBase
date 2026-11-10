import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "src") } },
  publicDir: false,
  base: "./",
  build: {
    outDir: path.resolve(import.meta.dirname, "../extension"),
    emptyOutDir: false,
    assetsDir: "assets",
    rollupOptions: {
      input: {
        popup: path.resolve(import.meta.dirname, "popup.html"),
      },
      output: {
        entryFileNames: "assets/[name].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name].[ext]",
      },
    },
  },
});
