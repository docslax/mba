import { Box, Heading } from "@chakra-ui/react";

export const Banner = ({ title }: { title: string }) => {
  return (
    <Box bg="#2f6f4f" color="white" textAlign="center" py={7}>
      <Heading size="lg">{title}</Heading>
    </Box>
  );
};
