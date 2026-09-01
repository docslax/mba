import { Box, Heading } from "@chakra-ui/react";

export const Banner = ({ title }: { title: string }) => {
  return (
    <Box bg="#2f6f4f" color="white" textAlign="center" py={7} px={3}>
      <Heading
        size={{ base: "md", md: "lg" }}
        lineHeight="1.2"
        whiteSpace="normal"
        maxW="container.md"
        mx="auto"
      >
        {title}
      </Heading>
    </Box>
  );
};
