import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "./", // caminhos relativos: obrigatório para Capacitor (file://) e offline
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      jsmediatags: fileURLToPath(
        new URL("./node_modules/jsmediatags/dist/jsmediatags.min.js", import.meta.url),
      ),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/jszip")) return "zip";
          if (id.includes("node_modules/jsmediatags")) return "tags";
        },
      },
    },
  },
});
