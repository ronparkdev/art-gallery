import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  base: process.env.BASE_URL || "/",
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
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
