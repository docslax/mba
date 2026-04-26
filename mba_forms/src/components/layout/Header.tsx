import { Box, Flex, Image, Text } from "@chakra-ui/react";
import logo from "../../assets/mba-logo.png";

export const Header = () => {
  return (
    <Box bg="#1f4e38" color="white" py={4}>
      <Flex maxW="1140px" mx="auto" px="16px" justifyContent="center">
        <Flex alignItems="center" gap={3}>
          <Image src={logo} boxSize="84px" alt="MBAofBC" flexShrink={0} />
          <Box>
            <Text
              fontWeight="700"
              fontSize="24px"
              lineHeight="30.86px"
              mb="2px"
              letterSpacing="0.2px"
              color="brand.header"
            >
              Master Bowlers Association of B.C.
            </Text>
            <Text
              fontSize="16px"
              color="white"
              fontWeight="400"
              lineHeight="1.2"
            >
              2924 Tatla Place, Coquitlam, BC, V3C 4W8
            </Text>
          </Box>
        </Flex>
      </Flex>
    </Box>
  );
};
