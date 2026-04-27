import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Input,
  Select,
  SimpleGrid,
  Text,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import SubmissionConfirmationModal from "./SubmissionConfirmationModal";
import { Layout } from "./layout/Layout";

type ProductPricingTier = {
  sizes: string[];
  price: number;
};

type ProductRecord = {
  id: number;
  name: string;
  pricingConfig?: {
    tiers?: ProductPricingTier[];
  };
};

type SubmittedOrderSummary = {
  orderId: number;
  name: string;
  jacketName: string;
  jacketType: string;
  jacketSize: string;
  quantity: number;
  totalAmount: string;
  paymentEmail: string;
};

export default function JacketOrderForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [email, setEmail] = useState("");
  const [jacketName, setJacketName] = useState("");
  const [jacketType, setJacketType] = useState("Men");
  const [jacketSize, setJacketSize] = useState("M");
  const [quantity, setQuantity] = useState(1);
  const [productId, setProductId] = useState<number | null>(null);
  const [pricingTiers, setPricingTiers] = useState<ProductPricingTier[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [submittedOrder, setSubmittedOrder] =
    useState<SubmittedOrderSummary | null>(null);

  const API_URL = import.meta.env.VITE_API_URL;
  const API_KEY = import.meta.env.VITE_API_KEY;

  useEffect(() => {
    const loadProductPricing = async () => {
      try {
        const response = await fetch(`${API_URL}/products`, {
          headers: {
            "x-api-key": API_KEY,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to load pricing.");
        }

        const products: ProductRecord[] = await response.json();
        const jacketProduct = products.find((product) =>
          product.name.toLowerCase().includes("jacket"),
        );

        if (!jacketProduct) {
          throw new Error("Jacket product configuration not found.");
        }

        setProductId(jacketProduct.id);
        setPricingTiers(jacketProduct.pricingConfig?.tiers ?? []);
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Unable to load jacket pricing configuration.";
        setSubmitError(errorMessage);
      }
    };

    loadProductPricing();
  }, [API_KEY, API_URL]);

  const getPriceForSize = (size: string) => {
    const tier = pricingTiers.find((pricingTier) =>
      pricingTier.sizes.includes(size),
    );
    return tier ? Number(tier.price) : 0;
  };
  const selectableSizes = Array.from(
    new Set(pricingTiers.flatMap((pricingTier) => pricingTier.sizes)),
  );

  useEffect(() => {
    if (selectableSizes.length === 0) {
      if (jacketSize !== "M") {
        setJacketSize("M");
      }
      return;
    }

    if (!selectableSizes.includes(jacketSize)) {
      setJacketSize(selectableSizes[0]);
    }
  }, [selectableSizes, jacketSize]);

  const price = getPriceForSize(jacketSize);
  const totalAmount = price * quantity;
  const pricingSummary =
    pricingTiers.length > 0
      ? pricingTiers
          .map(
            (tier) =>
              `$${Number(tier.price).toFixed(2)} Sizes ${tier.sizes.join(", ")}`,
          )
          .join(" | ")
      : "$110.00 Sizes XS – 2XL | $121 Sizes 3XL – 4XL | $126 Sizes 5XL – 6XL";

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
      !jacketName
    ) {
      setSubmitError("Please fill in all required fields.");
      return;
    }

    if (!productId) {
      setSubmitError(
        "Jacket product pricing is not loaded yet. Please try again.",
      );
      return;
    }

    if (price <= 0) {
      setSubmitError(`No price configured for jacket size ${jacketSize}.`);
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
          productId,
          // Send as generic product fields for flexibility
          productType: "Jacket",
          productName: jacketName,
          productSize: jacketSize,
          productCategory: jacketType,
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
        jacketName,
        jacketType,
        jacketSize,
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
      setJacketName("");
      setJacketType("Men");
      setJacketSize("M");
      setQuantity(1);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to submit order";
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout title="Jacket Order Form">
      <Container maxW="lg" py={0}>
        <Text textAlign="center" mb={6}>
          {pricingSummary}
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
            <FormLabel>Name on Jacket</FormLabel>
            <Input
              name="jacketName"
              placeholder="Your name"
              value={jacketName}
              onChange={(e) => setJacketName(e.target.value)}
              disabled={isSubmitting}
            />
          </FormControl>

          <SimpleGrid columns={[1, 2]} spacing={4} mt={4}>
            <FormControl isRequired>
              <FormLabel>Jacket Type</FormLabel>
              <Select
                value={jacketType}
                onChange={(e) => {
                  setJacketType(e.target.value);
                }}
                disabled={isSubmitting}
              >
                <option value="Men">Men</option>
                <option value="Ladies">Ladies</option>
              </Select>
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Jacket Size</FormLabel>
              <Select
                value={jacketSize}
                onChange={(e) => setJacketSize(e.target.value)}
                disabled={isSubmitting}
              >
                {selectableSizes.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </Select>
            </FormControl>
          </SimpleGrid>

          <Alert status="warning" mt={4} mb={4} rounded="md">
            <AlertIcon />
            <Box>
              <Text fontWeight="bold">NOTE: Sizing Guide Coming Soon</Text>
              <Text fontSize="sm">
                We're working on detailed sizing information. For now, please
                note that the Jackets fit small, order at least one size up from
                your normal shirt size.
              </Text>
            </Box>
          </Alert>

          <SimpleGrid columns={[1, 2]} spacing={4} mt={4}>
            <FormControl isRequired>
              <FormLabel># of Jackets Ordered</FormLabel>
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
            colorScheme="green"
            mt={6}
            w="full"
            disabled={isSubmitting}
            isLoading={isSubmitting}
            loadingText="Submitting..."
          >
            Submit Order
          </Button>
        </Box>

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
                  { label: "Name on jacket", value: submittedOrder.jacketName },
                  {
                    label: "Jacket",
                    value: `${submittedOrder.jacketType} ${submittedOrder.jacketSize}`,
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
                  `Use "Jacket Order #${submittedOrder.orderId} - ${submittedOrder.name}" as the payment note/reference.`,
                  "Keep this confirmation until payment is complete.",
                ]
              : []
          }
        />
      </Container>
    </Layout>
  );
}
