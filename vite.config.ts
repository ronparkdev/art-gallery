import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  base: process.env.BASE_URL || "/",
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  publicDir: "public", // public 폴더 설정 추가
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ["three"],
        },
      },
    },
  },
  server: {
    port: 3000,
    open: true,
  },
});
