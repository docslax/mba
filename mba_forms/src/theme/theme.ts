// src/theme/theme.ts
import { extendTheme } from "@chakra-ui/react";

export const theme = extendTheme({
  colors: {
    brand: {
      dark: "#1f4e38",
      main: "#2f6f4f",
      accent: "#f4b400",
      header: "#7ab27b",
    },
  },
  fonts: {
    heading: "Lato, 'Helvetica Neue', Arial, Helvetica, sans-serif",
    body: "Lato, 'Helvetica Neue', Arial, Helvetica, sans-serif",
  },
});
