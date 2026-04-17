import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  build: {
    outDir: "dist",
    sourcemap: false,       // disable in production for smaller bundle
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Split large vendor chunks for better caching
        manualChunks: {
          react:    ["react", "react-dom", "react-router-dom"],
          charts:   ["recharts"],
          ui:       ["lucide-react", "react-hot-toast"],
        },
      },
    },
  },
});
