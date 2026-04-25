import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom"],
          chakra: [
            "@chakra-ui/react",
            "@chakra-ui/icons",
            "@emotion/react",
            "@emotion/styled",
            "framer-motion",
          ],
        },
      },
    },
  },
});
