import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

const sourceDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "src");
const aliases = ["assets", "components", "context", "layouts", "service", "views"];

export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: Object.fromEntries(aliases.map((name) => [name, path.join(sourceDirectory, name)])),
  },
  server: {
    host: "0.0.0.0",
    port: 3000,
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:5000",
        changeOrigin: true,
      },
    },
  },
  build: { outDir: "dist", emptyOutDir: true },
});
