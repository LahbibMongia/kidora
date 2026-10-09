import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

const sourceDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "src");
const aliases = ["assets", "components", "context", "layouts", "service", "views"];
const port = Number(process.env.PORT || 3000);
const apiProxyTarget = process.env.VITE_API_PROXY_TARGET || "http://127.0.0.1:5000";

export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: Object.fromEntries(aliases.map((name) => [name, path.join(sourceDirectory, name)])),
  },
  server: {
    host: "0.0.0.0",
    port,
    strictPort: true,
    proxy: {
      "/api": {
        target: apiProxyTarget,
        changeOrigin: true,
      },
      "/images": {
        target: apiProxyTarget,
        changeOrigin: true,
      },
    },
  },
  build: { outDir: "dist", emptyOutDir: true },
});
