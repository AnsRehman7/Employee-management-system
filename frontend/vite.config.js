import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/firebase") || id.includes("node_modules/@firebase")) return "firebase";
          if (id.includes("node_modules/react-icons")) return "icons";
          if (id.includes("node_modules/react")) return "react";
          return undefined;
        },
      },
    },
  },
  plugins: [react(), tailwindcss()],
});
