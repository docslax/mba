import {
  Box,
  Button,
  Container,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Select,
  SimpleGrid,
  Text,
} from "@chakra-ui/react";
import { useState } from "react";

export default function App() {
  const [shirtType, setShirtType] = useState("Men");
  const [shirtSize, setShirtSize] = useState("M");
  const [quantity, setQuantity] = useState(1);

  const MEN_SIZES = [
    "XS",
    "S",
    "M",
    "L",
    "XL",
    "2XL",
    "3XL",
    "4XL",
    "5XL",
    "6XL",
  ];
  const LADY_SIZES = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL"];

  const price = ["2XL", "3XL", "4XL", "5XL", "6XL"].includes(shirtSize)
    ? 70
    : 60;
  const totalAmount = price * quantity;

  return (
    <Container maxW="lg" py={10}>
      <Heading textAlign="center" size="lg" mb={2}>
        Master Bowlers Association of BC
      </Heading>
      <Heading textAlign="center" size="md" mb={4}>
        Golf Shirt Order Form
      </Heading>
      <Text textAlign="center" mb={6}>
        $60.00 Sizes XS – XL &nbsp;|&nbsp; $70.00 Sizes 2XL – 6XL
      </Text>

      <Box as="form" bg="gray.50" p={6} rounded="md" shadow="sm">
        <SimpleGrid columns={[1, 2]} spacing={4}>
          <FormControl isRequired>
            <FormLabel>Name</FormLabel>
            <Input name="name" />
          </FormControl>

          <FormControl>
            <FormLabel>Phone #</FormLabel>
            <Input name="phone" />
          </FormControl>
        </SimpleGrid>

        <FormControl mt={4}>
          <FormLabel>Address</FormLabel>
          <Input name="address" />
        </FormControl>

        <SimpleGrid columns={[1, 2]} spacing={4} mt={4}>
          <FormControl>
            <FormLabel>City</FormLabel>
            <Input name="city" />
          </FormControl>
          <FormControl>
            <FormLabel>Postal Code</FormLabel>
            <Input name="postalCode" />
          </FormControl>
        </SimpleGrid>

        <FormControl mt={4} isRequired>
          <FormLabel>Email</FormLabel>
          <Input type="email" name="email" />
        </FormControl>

        <FormControl mt={4}>
          <FormLabel>Name on Shirt</FormLabel>
          <Input name="shirtName" />
        </FormControl>

        <SimpleGrid columns={[1, 2]} spacing={4} mt={4}>
          <FormControl>
            <FormLabel>Shirt Type</FormLabel>
            <Select
              value={shirtType}
              onChange={(e) => setShirtType(e.target.value)}
            >
              <option>Men</option>
              <option>Ladies</option>
            </Select>
          </FormControl>

          <FormControl>
            <FormLabel>Shirt Size</FormLabel>
            <Select
              value={shirtSize}
              onChange={(e) => setShirtSize(e.target.value)}
            >
              {(shirtType === "Men" ? MEN_SIZES : LADY_SIZES).map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </Select>
          </FormControl>
        </SimpleGrid>

        <SimpleGrid columns={[1, 2]} spacing={4} mt={4}>
          <FormControl>
            <FormLabel># of Shirts Ordered</FormLabel>
            <Input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value))}
            />
          </FormControl>

          <FormControl>
            <FormLabel>Total Amount</FormLabel>
            <Input value={`$${totalAmount.toFixed(2)}`} readOnly />
          </FormControl>
        </SimpleGrid>

        <Button type="submit" colorScheme="blue" mt={6} w="full">
          Submit Order
        </Button>
      </Box>

      <Flex direction="column" align="center" mt={8} fontSize="sm">
        <Text>
          Email Order Form to: <strong>jgrosart23@gmail.com</strong>
        </Text>
        <Text>
          E-transfer payment to: <strong>MBAofBC.payments@gmail.com</strong>
        </Text>
      </Flex>
    </Container>
  );
}
