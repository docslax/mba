// src/theme/theme.ts
import { extendTheme } from "@chakra-ui/react";

export const theme = extendTheme({
  colors: {
    brand: {
      dark: "#1f4e38",
      main: "#2f6f4f",
      accent: "#f4b400",
      header: "#7ab27b",
      background: "#f4f6f5",
    },
  },
  fonts: {
    heading: "Lato, 'Helvetica Neue', Arial, Helvetica, sans-serif",
    body: "Lato, 'Helvetica Neue', Arial, Helvetica, sans-serif",
  },
  styles: {
    global: {
      body: {
        bg: "brand.background",
      },
    },
  },
});
