import { Box, Link, Text } from "@chakra-ui/react";

const Copyright = () => <span>&copy;</span>;

export const Footer = () => {
  return (
    <Box
      backgroundColor="brand.dark"
      color="white"
      textAlign="center"
      py={4}
      mt={10}
    >
      <Box>
        <Text>
          <Copyright /> {new Date().getFullYear()} Master Bowlers Association of
          B.C. All rights reserved.
        </Text>
        <Text fontSize="sm" opacity={0.85} mt={1}>
          Developed by{" "}
          <Link
            href="https://github.com/docslax"
            isExternal
            textDecoration="underline"
          >
            Darrel Siegle
          </Link>
        </Text>
      </Box>
    </Box>
  );
};
