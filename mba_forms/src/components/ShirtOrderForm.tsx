import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Collapse,
  Container,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Select,
  SimpleGrid,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
} from "@chakra-ui/react";
import { useState } from "react";
import { ChevronDownIcon, ChevronUpIcon } from "@chakra-ui/icons";
import SubmissionConfirmationModal from "./SubmissionConfirmationModal";

type SubmittedOrderSummary = {
  orderId: number;
  name: string;
  shirtName: string;
  shirtType: string;
  shirtSize: string;
  quantity: number;
  totalAmount: string;
  paymentEmail: string;
};

export default function ShirtOrderForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [email, setEmail] = useState("");
  const [shirtName, setShirtName] = useState("");
  const [shirtType, setShirtType] = useState("Men");
  const [shirtSize, setShirtSize] = useState("M");
  const [quantity, setQuantity] = useState(1);
  const [showSizingGuide, setShowSizingGuide] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [submittedOrder, setSubmittedOrder] =
    useState<SubmittedOrderSummary | null>(null);

  const API_URL = import.meta.env.VITE_API_URL;
  const API_KEY = import.meta.env.VITE_API_KEY;

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

  const menSizingData = [
    {
      measurement: "Chest",
      xs: '30"-32"',
      s: '34"-36"',
      m: '38"-40"',
      l: '42"-44"',
      xl: '46"-48"',
      "2xl": '50"-52"',
      "3xl": '54"-55"',
      "4xl": '56"-57"',
      "5xl": '58"-61"',
      "6xl": '61"-64"',
    },
    {
      measurement: "Waist",
      xs: '26"-29"',
      s: '29"-32"',
      m: '32"-35"',
      l: '35"-38"',
      xl: '38"-41"',
      "2xl": '41"-44"',
      "3xl": '44"-47"',
      "4xl": '47"-50"',
      "5xl": '50"-53"',
      "6xl": '53"-56"',
    },
    {
      measurement: "Sleeve Length - CR",
      xs: '31"-32"',
      s: '32"-33.5"',
      m: '34"-35"',
      l: '35.5"-36"',
      xl: '37"-38"',
      "2xl": '37"-38"',
      "3xl": '38.5"-39.5"',
      "4xl": '39.5"-40"',
      "5xl": "",
      "6xl": "",
    },
    {
      measurement: "Sleeve Length - CB Tall",
      xs: "",
      s: "",
      m: "",
      l: "",
      xl: "",
      "2xl": '37"-37.5"',
      "3xl": '38"-38.5"',
      "4xl": '40.5"-41"',
      "5xl": "",
      "6xl": "",
    },
  ];

  const ladiesSizingData = [
    {
      measurement: "Numeric Size",
      xs: "2",
      s: "4-6",
      m: "8-10",
      l: "12-14",
      xl: "16",
      "2xl": "18-20",
      "3xl": "22",
      "4xl": "24",
    },
    {
      measurement: "Bust",
      xs: '32"-34"',
      s: '35"-36"',
      m: '37"-38"',
      l: '39"-41"',
      xl: '42"-44"',
      "2xl": '45"-47"',
      "3xl": '48"-51"',
      "4xl": '52"-55"',
    },
    {
      measurement: "Waist",
      xs: '24"-25"',
      s: '26"-27"',
      m: '28"-30"',
      l: '30"-32"',
      xl: '33"-35"',
      "2xl": '36"-38"',
      "3xl": '40"-42"',
      "4xl": '42"-44"',
    },
    {
      measurement: "Hip",
      xs: '33"-35"',
      s: '36"-37"',
      m: '38"-39"',
      l: '39"-41"',
      xl: '47"-49"',
      "2xl": '45"-47"',
      "3xl": '48"-50"',
      "4xl": '50"-52"',
    },
    {
      measurement: "Sleeve Length - CB",
      xs: '30"-30.5"',
      s: '30.5"-31"',
      m: '31.5"-32"',
      l: '33"-34"',
      xl: '34"-34.5"',
      "2xl": '34"-34.5"',
      "3xl": '34.5"-35"',
      "4xl": '34.5"-35"',
    },
  ];

  const price = ["2XL", "3XL", "4XL", "5XL", "6XL"].includes(shirtSize)
    ? 70
    : 60;
  const totalAmount = price * quantity;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError(null);

    // Validate required fields
    if (
      !name ||
      !phone ||
      !address ||
      !city ||
      !postalCode ||
      !email ||
      !shirtName
    ) {
      setSubmitError("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY,
        },
        body: JSON.stringify({
          name,
          phone,
          address,
          city,
          postalCode,
          email,
          shirtName,
          shirtType,
          shirtSize,
          quantity,
          totalAmount,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();

      setSubmittedOrder({
        orderId: data.order.id,
        name,
        shirtName,
        shirtType,
        shirtSize,
        quantity,
        totalAmount: totalAmount.toFixed(2),
        paymentEmail: "MBAofBC.payments@gmail.com",
      });
      setIsConfirmationOpen(true);

      // Reset form
      setName("");
      setPhone("");
      setAddress("");
      setCity("");
      setPostalCode("");
      setEmail("");
      setShirtName("");
      setShirtType("Men");
      setShirtSize("M");
      setQuantity(1);
      setShowSizingGuide(false);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to submit order";
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const SizingGuideTable = ({
    data,
    sizes,
  }: {
    data: Array<Record<string, string>>;
    sizes: string[];
  }) => (
    <TableContainer border="1px" borderColor="gray.200" rounded="md" mt={4}>
      <Table size="sm" variant="striped">
        <Thead bg="blue.50">
          <Tr>
            <Th minW="140px" fontWeight="bold">
              Measurement
            </Th>
            {sizes.map((size) => (
              <Th
                key={size}
                textAlign="center"
                fontWeight="bold"
                bg={shirtSize === size ? "blue.200" : "transparent"}
              >
                {size}
              </Th>
            ))}
          </Tr>
        </Thead>
        <Tbody>
          {data.map((row) => (
            <Tr key={row.measurement}>
              <Td fontWeight="600" fontSize="sm">
                {row.measurement}
              </Td>
              {sizes.map((size) => (
                <Td
                  key={`${row.measurement}-${size}`}
                  textAlign="center"
                  fontSize="xs"
                  bg={shirtSize === size ? "blue.100" : "transparent"}
                  fontWeight={shirtSize === size ? "600" : "normal"}
                >
                  {row[size.toLowerCase()] || "-"}
                </Td>
              ))}
            </Tr>
          ))}
        </Tbody>
      </Table>
    </TableContainer>
  );

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

      <Box
        as="form"
        bg="gray.50"
        p={6}
        rounded="md"
        shadow="sm"
        onSubmit={handleSubmit}
      >
        {submitError && (
          <Alert status="error" mb={4} rounded="md">
            <AlertIcon />
            {submitError}
          </Alert>
        )}

        <SimpleGrid columns={[1, 2]} spacing={4}>
          <FormControl isRequired>
            <FormLabel>Full Name</FormLabel>
            <Input
              name="name"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Phone Number</FormLabel>
            <Input
              name="phone"
              placeholder="(555) 123-4567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={isSubmitting}
            />
          </FormControl>
        </SimpleGrid>

        <FormControl mt={4} isRequired>
          <FormLabel>Address</FormLabel>
          <Input
            name="address"
            placeholder="123 Main Street"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            disabled={isSubmitting}
          />
        </FormControl>

        <SimpleGrid columns={[1, 2]} spacing={4} mt={4}>
          <FormControl isRequired>
            <FormLabel>City</FormLabel>
            <Input
              name="city"
              placeholder="Vancouver"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              disabled={isSubmitting}
            />
          </FormControl>
          <FormControl isRequired>
            <FormLabel>Postal Code</FormLabel>
            <Input
              name="postalCode"
              placeholder="V6B 1A1"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              disabled={isSubmitting}
            />
          </FormControl>
        </SimpleGrid>

        <FormControl mt={4} isRequired>
          <FormLabel>Email</FormLabel>
          <Input
            type="email"
            name="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSubmitting}
          />
        </FormControl>

        <FormControl mt={4} isRequired>
          <FormLabel>Name on Shirt</FormLabel>
          <Input
            name="shirtName"
            placeholder="Your name"
            value={shirtName}
            onChange={(e) => setShirtName(e.target.value)}
            disabled={isSubmitting}
          />
        </FormControl>

        <SimpleGrid columns={[1, 2]} spacing={4} mt={4}>
          <FormControl isRequired>
            <FormLabel>Shirt Type</FormLabel>
            <Select
              value={shirtType}
              onChange={(e) => {
                setShirtType(e.target.value);
                setShirtSize(e.target.value === "Men" ? "M" : "M");
              }}
              disabled={isSubmitting}
            >
              <option value="Men">Men</option>
              <option value="Ladies">Ladies</option>
            </Select>
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Shirt Size</FormLabel>
            <Select
              value={shirtSize}
              onChange={(e) => setShirtSize(e.target.value)}
              disabled={isSubmitting}
            >
              {(shirtType === "Men" ? MEN_SIZES : LADY_SIZES).map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </Select>
          </FormControl>
        </SimpleGrid>

        <Box mt={3} mb={4}>
          <Button
            size="sm"
            variant="ghost"
            colorScheme="blue"
            onClick={() => setShowSizingGuide(!showSizingGuide)}
            rightIcon={
              showSizingGuide ? <ChevronUpIcon /> : <ChevronDownIcon />
            }
            disabled={isSubmitting}
          >
            {showSizingGuide ? "Hide" : "Show"} Sizing Guide
          </Button>
        </Box>

        <Collapse in={showSizingGuide} animateOpacity>
          <SizingGuideTable
            data={shirtType === "Men" ? menSizingData : ladiesSizingData}
            sizes={shirtType === "Men" ? MEN_SIZES : LADY_SIZES}
          />
        </Collapse>

        <SimpleGrid columns={[1, 2]} spacing={4} mt={4}>
          <FormControl isRequired>
            <FormLabel># of Shirts Ordered</FormLabel>
            <Input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value))}
              disabled={isSubmitting}
            />
          </FormControl>

          <FormControl>
            <FormLabel>Total Amount</FormLabel>
            <Input value={`$${totalAmount.toFixed(2)}`} readOnly />
          </FormControl>
        </SimpleGrid>

        <Button
          type="submit"
          colorScheme="blue"
          mt={6}
          w="full"
          disabled={isSubmitting}
          isLoading={isSubmitting}
          loadingText="Submitting..."
        >
          Submit Order
        </Button>
      </Box>

      <Flex direction="column" align="center" mt={8} fontSize="sm">
        <Text>
          Email Order Form to: <strong>MBAofBC.shirts@gmail.com</strong>
        </Text>
        <Text>
          E-transfer payment to: <strong>MBAofBC.payments@gmail.com</strong>
        </Text>
      </Flex>

      <SubmissionConfirmationModal
        isOpen={isConfirmationOpen}
        onClose={() => setIsConfirmationOpen(false)}
        title="Order submitted successfully"
        subtitle={
          submittedOrder
            ? `Thank you ${submittedOrder.name}. Please review your order details and complete payment.`
            : undefined
        }
        summaryItems={
          submittedOrder
            ? [
                { label: "Order #", value: String(submittedOrder.orderId) },
                { label: "Name on shirt", value: submittedOrder.shirtName },
                {
                  label: "Shirt",
                  value: `${submittedOrder.shirtType} ${submittedOrder.shirtSize}`,
                },
                { label: "Quantity", value: String(submittedOrder.quantity) },
                {
                  label: "Total",
                  value: `$${submittedOrder.totalAmount}`,
                },
              ]
            : []
        }
        nextSteps={
          submittedOrder
            ? [
                `Send e-transfer to ${submittedOrder.paymentEmail}.`,
                `Use "Order #${submittedOrder.orderId}" as the payment note/reference.`,
                "Keep this confirmation until payment is complete.",
              ]
            : []
        }
      />
    </Container>
  );
}
