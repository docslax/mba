import { Box, Link } from "@chakra-ui/react";

export const BackNav = () => {
  return (
    <Box bg="brand.dark" py={4} textAlign="center">
      <Link
        href="https://www.mbaofbc.com/forms"
        color="brand.accent"
        fontWeight="medium"
        _hover={{ color: "brand.accent", textDecoration: "none" }}
      >
        ← Return to MBAofBC
      </Link>
    </Box>
  );
};
