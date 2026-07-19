import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Checkbox,
  Container,
  Divider,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Input,
  Radio,
  RadioGroup,
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useMemo, useState } from "react";
import SubmissionConfirmationModal from "./SubmissionConfirmationModal";
import FeeOptionChecklist, { type FeeOption } from "./forms/FeeOptionChecklist";
import { Layout } from "./layout/Layout";

const PARTICIPANT_FEE_OPTIONS: FeeOption[] = [
  { id: "seniors", label: "Seniors", amount: 275 },
  {
    id: "first-time-seniors",
    label: "First Time Seniors Division",
    amount: 225,
  },
  {
    id: "lifetime-seniors",
    label: "Lifetime Seniors Division",
    amount: 225,
  },
  { id: "poa", label: "POA", amount: 275 },
  { id: "first-time-poa", label: "First Time POA Division", amount: 225 },
  { id: "lifetime-poa", label: "Lifetime POA Division", amount: 225 },
];

const NON_PARTICIPANT_FEE_OPTIONS: FeeOption[] = [
  { id: "associate", label: "Associate Member", amount: 65 },
  { id: "teach-only", label: "Teach Only", amount: 65 },
  { id: "lifetime", label: "Lifetime Member", amount: 15 },
];

const TOURNAMENT_ENTRY_FEE = 40;
const PAYMENT_EMAIL = "MBAofBC.payments@gmail.com";

type SubmittedMembershipSummary = {
  orderId: number;
  name: string;
  participantMemberships: string;
  nonParticipantMemberships: string;
  tournamentPrepayAmount: string;
  totalAmount: string;
  paymentEmail: string;
};

const sumSelectedFees = (options: FeeOption[], selectedIds: string[]) =>
  options
    .filter((option) => selectedIds.includes(option.id))
    .reduce((total, option) => total + option.amount, 0);

const getSelectedLabels = (options: FeeOption[], selectedIds: string[]) =>
  options
    .filter((option) => selectedIds.includes(option.id))
    .map((option) => option.label);

const calculateTournamentPrepay = (prepayCount: number) => {
  const safeCount = Number.isNaN(prepayCount) || prepayCount < 0 ? 0 : prepayCount;
  const rawAmount = safeCount * TOURNAMENT_ENTRY_FEE;
  const freeEntries = Math.floor(safeCount / 5);
  const discount = freeEntries * TOURNAMENT_ENTRY_FEE;

  return {
    prepayCount: safeCount,
    rawAmount,
    freeEntries,
    discount,
    totalAmount: rawAmount - discount,
  };
};

export default function MembershipApplicationForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [gender, setGender] = useState("");
  const [fivePinCardNumber, setFivePinCardNumber] = useState("");
  const [isCommunityCoach, setIsCommunityCoach] = useState(false);
  const [isCompetitiveCoach, setIsCompetitiveCoach] = useState(false);
  const [participantSelection, setParticipantSelection] = useState<string[]>([]);
  const [nonParticipantSelection, setNonParticipantSelection] = useState<string[]>(
    [],
  );
  const [prepayTournamentFees, setPrepayTournamentFees] = useState("no");
  const [prepayCount, setPrepayCount] = useState(0);
  const [playingMoreThanOneDivision, setPlayingMoreThanOneDivision] =
    useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [submittedApplication, setSubmittedApplication] =
    useState<SubmittedMembershipSummary | null>(null);

  const API_URL = import.meta.env.VITE_API_URL;
  const API_KEY = import.meta.env.VITE_API_KEY;

  const toggleSelection = (value: string, selected: string[], setter: (value: string[]) => void) => {
    setter(
      selected.includes(value)
        ? selected.filter((item) => item !== value)
        : [...selected, value],
    );
  };

  const participantFees = useMemo(
    () => sumSelectedFees(PARTICIPANT_FEE_OPTIONS, participantSelection),
    [participantSelection],
  );
  const nonParticipantFees = useMemo(
    () => sumSelectedFees(NON_PARTICIPANT_FEE_OPTIONS, nonParticipantSelection),
    [nonParticipantSelection],
  );
  const tournamentTotals = useMemo(
    () => calculateTournamentPrepay(prepayTournamentFees === "yes" ? prepayCount : 0),
    [prepayCount, prepayTournamentFees],
  );

  const totalAmount = participantFees + nonParticipantFees + tournamentTotals.totalAmount;

  const participantMembershipLabels = useMemo(
    () => getSelectedLabels(PARTICIPANT_FEE_OPTIONS, participantSelection),
    [participantSelection],
  );
  const nonParticipantMembershipLabels = useMemo(
    () => getSelectedLabels(NON_PARTICIPANT_FEE_OPTIONS, nonParticipantSelection),
    [nonParticipantSelection],
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);

    if (!name || !email || !phone || !address || !city || !postalCode) {
      setSubmitError("Please fill in all required applicant information fields.");
      return;
    }

    if (participantSelection.length === 0 && nonParticipantSelection.length === 0) {
      setSubmitError("Please select at least one membership fee option.");
      return;
    }

    if (prepayTournamentFees === "yes" && prepayCount < 1) {
      setSubmitError("Enter the number of tournament entries to prepay.");
      return;
    }

    setIsSubmitting(true);

    const coachingFlags = [
      isCommunityCoach ? "Community Coach" : null,
      isCompetitiveCoach ? "Competitive Coach" : null,
    ].filter(Boolean);

    const membershipNotes = [
      participantMembershipLabels.length > 0
        ? `Participant: ${participantMembershipLabels.join(", ")}`
        : null,
      nonParticipantMembershipLabels.length > 0
        ? `Non-participant: ${nonParticipantMembershipLabels.join(", ")}`
        : null,
      fivePinCardNumber ? `5 Pin Card: ${fivePinCardNumber}` : null,
      coachingFlags.length > 0 ? `Coaching: ${coachingFlags.join(", ")}` : null,
      prepayTournamentFees === "yes"
        ? `Prepay entries: ${tournamentTotals.prepayCount} (free: ${tournamentTotals.freeEntries})`
        : "Prepay entries: no",
      playingMoreThanOneDivision ? "Playing multiple divisions: yes" : null,
    ]
      .filter(Boolean)
      .join(" | ");

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
          productType: "Membership",
          productName: `${name} 2025/2026 Application`,
          productCategory: membershipNotes,
          productSize: gender || "N/A",
          quantity: 1,
          totalAmount,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();

      setSubmittedApplication({
        orderId: data.order.id,
        name,
        participantMemberships:
          participantMembershipLabels.length > 0
            ? participantMembershipLabels.join(", ")
            : "None",
        nonParticipantMemberships:
          nonParticipantMembershipLabels.length > 0
            ? nonParticipantMembershipLabels.join(", ")
            : "None",
        tournamentPrepayAmount: `$${tournamentTotals.totalAmount.toFixed(2)}`,
        totalAmount: totalAmount.toFixed(2),
        paymentEmail: PAYMENT_EMAIL,
      });
      setIsConfirmationOpen(true);

      setName("");
      setEmail("");
      setPhone("");
      setAddress("");
      setCity("");
      setPostalCode("");
      setGender("");
      setFivePinCardNumber("");
      setIsCommunityCoach(false);
      setIsCompetitiveCoach(false);
      setParticipantSelection([]);
      setNonParticipantSelection([]);
      setPrepayTournamentFees("no");
      setPrepayCount(0);
      setPlayingMoreThanOneDivision(false);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to submit membership application";
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout title="2025/2026 Membership Application Form">
      <Container maxW="3xl" py={0}>
        <Text textAlign="center" color="gray.600" mb={6}>
          POA/Seniors Division and Non-Participants
        </Text>

        <Box
          as="form"
          bg="gray.50"
          p={[4, 6]}
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

          <Heading size="md" mb={4}>
            Applicant Information
          </Heading>

          <SimpleGrid columns={[1, 1, 3]} spacing={4}>
            <FormControl isRequired>
              <FormLabel>Name</FormLabel>
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Full name"
                disabled={isSubmitting}
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Email</FormLabel>
              <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                disabled={isSubmitting}
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Phone</FormLabel>
              <Input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="(555) 123-4567"
                disabled={isSubmitting}
              />
            </FormControl>
          </SimpleGrid>

          <SimpleGrid columns={[1, 1, 3]} spacing={4} mt={4}>
            <FormControl isRequired>
              <FormLabel>Address</FormLabel>
              <Input
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                placeholder="Street address"
                disabled={isSubmitting}
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>City</FormLabel>
              <Input
                value={city}
                onChange={(event) => setCity(event.target.value)}
                placeholder="City"
                disabled={isSubmitting}
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Postal Code</FormLabel>
              <Input
                value={postalCode}
                onChange={(event) => setPostalCode(event.target.value)}
                placeholder="V6B 1A1"
                disabled={isSubmitting}
              />
            </FormControl>
          </SimpleGrid>

          <SimpleGrid columns={[1, 1, 3]} spacing={4} mt={4}>
            <FormControl>
              <FormLabel>Gender</FormLabel>
              <RadioGroup value={gender} onChange={setGender}>
                <HStack spacing={4}>
                  <Radio value="Male">Male</Radio>
                  <Radio value="Female">Female</Radio>
                </HStack>
              </RadioGroup>
            </FormControl>

            <FormControl>
              <FormLabel>Canadian 5 Pin Card No.</FormLabel>
              <Input
                value={fivePinCardNumber}
                onChange={(event) => setFivePinCardNumber(event.target.value)}
                placeholder="Optional"
                disabled={isSubmitting}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Coaching</FormLabel>
              <Stack spacing={2}>
                <Checkbox
                  isChecked={isCommunityCoach}
                  onChange={(event) => setIsCommunityCoach(event.target.checked)}
                  colorScheme="green"
                  disabled={isSubmitting}
                >
                  Community Coach
                </Checkbox>
                <Checkbox
                  isChecked={isCompetitiveCoach}
                  onChange={(event) => setIsCompetitiveCoach(event.target.checked)}
                  colorScheme="green"
                  disabled={isSubmitting}
                >
                  Competitive Coach
                </Checkbox>
              </Stack>
            </FormControl>
          </SimpleGrid>

          <Divider my={6} />

          <Heading size="md" mb={4}>
            Membership Fees for Participants
          </Heading>
          <FeeOptionChecklist
            options={PARTICIPANT_FEE_OPTIONS}
            selectedOptionIds={participantSelection}
            onToggleOption={(optionId) =>
              toggleSelection(optionId, participantSelection, setParticipantSelection)
            }
            isDisabled={isSubmitting}
          />

          <Text mt={3} fontSize="sm" color="gray.600">
            If you join more than one division, you are required to pay entry fees for each division.
          </Text>

          <Divider my={6} />

          <Heading size="md" mb={4}>
            Membership Fees for Non-Participants
          </Heading>
          <FeeOptionChecklist
            options={NON_PARTICIPANT_FEE_OPTIONS}
            selectedOptionIds={nonParticipantSelection}
            onToggleOption={(optionId) =>
              toggleSelection(
                optionId,
                nonParticipantSelection,
                setNonParticipantSelection,
              )
            }
            isDisabled={isSubmitting}
          />

          <Divider my={6} />

          <Heading size="md" mb={4}>
            Tournament Entry Pre-Payment
          </Heading>

          <SimpleGrid columns={[1, 1, 2]} spacing={4}>
            <FormControl>
              <FormLabel>Prepay Tournament Entry Fees</FormLabel>
              <RadioGroup
                value={prepayTournamentFees}
                onChange={setPrepayTournamentFees}
              >
                <HStack spacing={6}>
                  <Radio value="yes">Yes</Radio>
                  <Radio value="no">No</Radio>
                </HStack>
              </RadioGroup>
            </FormControl>

            <FormControl isDisabled={prepayTournamentFees !== "yes"}>
              <FormLabel>Number to Prepay</FormLabel>
              <Input
                type="number"
                min={0}
                value={prepayCount}
                onChange={(event) => setPrepayCount(Number(event.target.value))}
                disabled={isSubmitting || prepayTournamentFees !== "yes"}
              />
            </FormControl>
          </SimpleGrid>

          <Text mt={2} color="green.700" fontWeight="600" fontSize="sm">
            Prepay for 5 and get one entry free. Entries are calculated at $40 each.
          </Text>

          <Divider my={6} />

          <Heading size="md" mb={4}>
            Payment Summary
          </Heading>

          <SimpleGrid columns={[1, 1, 3]} spacing={4}>
            <FormControl>
              <FormLabel>Membership Fees</FormLabel>
              <Input value={`$${(participantFees + nonParticipantFees).toFixed(2)}`} readOnly />
            </FormControl>

            <FormControl>
              <FormLabel>Tournament Entry Pre-Payment</FormLabel>
              <Input value={`$${tournamentTotals.totalAmount.toFixed(2)}`} readOnly />
            </FormControl>

            <FormControl>
              <FormLabel>Total Paid</FormLabel>
              <Input value={`$${totalAmount.toFixed(2)}`} readOnly fontWeight="700" />
            </FormControl>
          </SimpleGrid>

          {tournamentTotals.discount > 0 && (
            <Text mt={2} color="green.700" fontSize="sm">
              Tournament prepay discount applied: -${tournamentTotals.discount.toFixed(2)} ({tournamentTotals.freeEntries} free entries)
            </Text>
          )}

          <Checkbox
            mt={4}
            isChecked={playingMoreThanOneDivision}
            onChange={(event) => setPlayingMoreThanOneDivision(event.target.checked)}
            colorScheme="green"
            disabled={isSubmitting}
          >
            Check here if playing more than one division
          </Checkbox>

          <Box mt={6} p={4} border="1px" borderColor="gray.200" rounded="md" bg="white">
            <Text fontWeight="700" mb={1}>
              Payment methods accepted
            </Text>
            <Text fontSize="sm" color="gray.700">
              Cheque, cash (in person only), or e-transfer to {PAYMENT_EMAIL}.
            </Text>
            <Text fontSize="sm" color="gray.700">
              NSF cheque policy: replacement NSF cheque will require an additional $25.00.
            </Text>
          </Box>

          <Button
            type="submit"
            colorScheme="green"
            mt={6}
            w="full"
            disabled={isSubmitting}
            isLoading={isSubmitting}
            loadingText="Submitting..."
          >
            Submit Membership Application
          </Button>
        </Box>

        <SubmissionConfirmationModal
          isOpen={isConfirmationOpen}
          onClose={() => setIsConfirmationOpen(false)}
          title="Membership application submitted"
          subtitle={
            submittedApplication
              ? `Thank you ${submittedApplication.name}. Please complete your payment to finalize this application.`
              : undefined
          }
          summaryItems={
            submittedApplication
              ? [
                  {
                    label: "Application #",
                    value: String(submittedApplication.orderId),
                  },
                  {
                    label: "Participant memberships",
                    value: submittedApplication.participantMemberships,
                  },
                  {
                    label: "Non-participant memberships",
                    value: submittedApplication.nonParticipantMemberships,
                  },
                  {
                    label: "Tournament pre-payment",
                    value: submittedApplication.tournamentPrepayAmount,
                  },
                  {
                    label: "Total",
                    value: `$${submittedApplication.totalAmount}`,
                  },
                ]
              : []
          }
          nextSteps={
            submittedApplication
              ? [
                  `Send e-transfer to ${submittedApplication.paymentEmail}.`,
                  `Use "Membership Application #${submittedApplication.orderId} - ${submittedApplication.name}" as the payment note/reference.`,
                  "Keep this confirmation for your records.",
                ]
              : []
          }
        />
      </Container>
    </Layout>
  );
}