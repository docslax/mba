import {
  Box,
  Button,
  Container,
  Heading,
  SimpleGrid,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";

type FormOption = {
  id: string;
  title: string;
  description: string;
  path: string;
};

const AVAILABLE_FORMS: FormOption[] = [
  {
    id: "shirt-order",
    title: "Golf Shirt Order",
    description:
      "Order a custom golf shirt with sizing options for men's and ladies' styles.",
    path: "/forms/shirt-order",
  },
  {
    id: "jacket-order",
    title: "Jacket Order",
    description:
      "Order a custom jacket with sizing options for men's and ladies' styles.",
    path: "/forms/jacket-order",
  },
];

export default function FormSelector() {
  const navigate = useNavigate();

  return (
    <Container maxW="md" py={10}>
      <VStack spacing={8} align="stretch">
        <Box textAlign="center">
          <Heading size="lg" mb={2}>
            Master Bowlers Association of BC
          </Heading>
          <Text color="gray.600" fontSize="md">
            Select a form to get started
          </Text>
        </Box>

        <SimpleGrid spacing={4}>
          {AVAILABLE_FORMS.map((form) => (
            <Box
              key={form.id}
              p={6}
              border="1px"
              borderColor="gray.200"
              rounded="md"
              bg="white"
              shadow="sm"
              transition="all 0.2s"
              _hover={{ shadow: "md", borderColor: "blue.300" }}
            >
              <Heading size="md" mb={2}>
                {form.title}
              </Heading>
              <Text color="gray.600" mb={4} fontSize="sm">
                {form.description}
              </Text>
              <Button
                colorScheme="blue"
                w="full"
                onClick={() => navigate(form.path)}
              >
                Start Form
              </Button>
            </Box>
          ))}
        </SimpleGrid>
      </VStack>
    </Container>
  );
}
