import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { tanstackRouter } from "@tanstack/router-plugin/vite";

export default defineConfig({
  plugins: [
    // Generates routeTree.gen.ts from your src/routes/*.tsx files —
    // same file-based routing you already have, no SSR involved.
    tanstackRouter({ target: "react", autoCodeSplitting: false }),
    viteReact(),
    tailwindcss(),
    tsconfigPaths(),
  ],
  resolve: {
    // Force every dependency to resolve to the single copy of React in
    // this project's node_modules, instead of any bundled copy a
    // dependency might otherwise pull in during dev-server pre-bundling.
    dedupe: ["react", "react-dom"],
  },
  optimizeDeps: {
    include: ["react", "react-dom", "react-dom/client"],
  },
  server: {
    port: 8080,
  },
});