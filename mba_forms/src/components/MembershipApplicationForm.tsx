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
  Link,
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

const SENIORS_FEE_OPTIONS: FeeOption[] = [
  { id: "seniors", label: "Standard", amount: 275 },
  {
    id: "first-time-seniors",
    label: "First Time",
    amount: 225,
  },
  {
    id: "lifetime-seniors",
    label: "Lifetime",
    amount: 225,
  },
];

const POA_FEE_OPTIONS: FeeOption[] = [
  { id: "poa", label: "Standard", amount: 275 },
  { id: "first-time-poa", label: "First Time", amount: 225 },
  { id: "lifetime-poa", label: "Lifetime", amount: 225 },
];

const TOURNAMENT_FEE_OPTIONS: FeeOption[] = [
  { id: "tournament", label: "Standard", amount: 285 },
  {
    id: "first-time-tournament",
    label: "First Time",
    amount: 235,
  },
  {
    id: "lifetime-tournament",
    label: "Lifetime",
    amount: 235,
  },
];

const NON_PARTICIPANT_FEE_OPTIONS: FeeOption[] = [
  { id: "associate", label: "Associate Member", amount: 65 },
  { id: "teach-only", label: "Teach Only", amount: 65 },
  { id: "lifetime", label: "Lifetime Member", amount: 30 },
];

const SENIORS_POA_ENTRY_FEE = 40;
const TOURNAMENT_DIVISION_ENTRY_FEE = 50;
const SENIORS_POA_MAX_PREPAY_COUNT = 5;
const TOURNAMENT_MAX_PREPAY_COUNT = 4;
const SENIORS_POA_FREE_ENTRY_THRESHOLD = 5;
const TOURNAMENT_FREE_ENTRY_THRESHOLD = 4;
const PAYMENT_EMAIL = "MBAofBC.payments@gmail.com";
const FEE_SCHEDULE_URL = "https://example.com/fee-schedule";

type SubmittedMembershipSummary = {
  orderId: number;
  name: string;
  participantMemberships: string;
  nonParticipantMemberships: string;
  entryPrepayAmount: string;
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

const calculateDivisionPrepay = (
  prepayCount: number,
  entryFee: number,
  maxCount: number,
  freeEntryThreshold: number,
) => {
  const safeCount =
    Number.isNaN(prepayCount) || prepayCount < 0
      ? 0
      : Math.min(Math.floor(prepayCount), maxCount);
  const rawAmount = safeCount * entryFee;
  const freeEntries = Math.floor(safeCount / freeEntryThreshold);
  const discount = freeEntries * entryFee;

  return {
    prepayCount: safeCount,
    rawAmount,
    freeEntries,
    discount,
    totalAmount: rawAmount - discount,
  };
};

type DivisionFeeGroupCardProps = {
  title: string;
  options: FeeOption[];
  selectedOptionId: string;
  onToggleOption: (optionId: string) => void;
  isSelected: boolean;
  prepayEnabled: boolean;
  prepayCount: number;
  prepayEntryFee: number;
  maxPrepayCount: number;
  prepayFreeEntryThreshold: number;
  onPrepayEnabledChange: (enabled: boolean) => void;
  onPrepayCountChange: (count: number) => void;
  isDisabled?: boolean;
};

function DivisionFeeGroupCard({
  title,
  options,
  selectedOptionId,
  onToggleOption,
  isSelected,
  prepayEnabled,
  prepayCount,
  prepayEntryFee,
  maxPrepayCount,
  prepayFreeEntryThreshold,
  onPrepayEnabledChange,
  onPrepayCountChange,
  isDisabled,
}: DivisionFeeGroupCardProps) {
  return (
    <Box
      border="1px"
      borderColor="gray.300"
      rounded="md"
      bg="white"
      overflow="hidden"
    >
      <Box
        bg="gray.100"
        px={3}
        py={2}
        borderBottom="1px"
        borderColor="gray.300"
      >
        <Text fontWeight="700" fontSize="sm">
          {title}
        </Text>
      </Box>

      <SimpleGrid columns={[1, 1, 3]} spacing={0}>
        {options.map((option, index) => {
          const isChecked = selectedOptionId === option.id;

          return (
            <Box
              key={option.id}
              px={3}
              py={3}
              borderTopWidth={[
                index === 0 ? 0 : "1px",
                index === 0 ? 0 : "1px",
                0,
              ]}
              borderLeftWidth={[0, 0, index === 0 ? 0 : "1px"]}
              borderColor="gray.200"
              bg={isChecked ? "green.50" : "white"}
            >
              <Checkbox
                isChecked={isChecked}
                onChange={() => onToggleOption(option.id)}
                isDisabled={isDisabled}
                colorScheme="green"
                w="full"
              >
                <Stack spacing={0} align="start">
                  <Text fontWeight="600" fontSize="sm">
                    {option.label}
                  </Text>
                  <Text fontWeight="700" fontSize="sm">
                    ${option.amount.toFixed(2)}
                  </Text>
                </Stack>
              </Checkbox>
            </Box>
          );
        })}
      </SimpleGrid>

      <Box px={3} py={3} borderTop="1px" borderColor="gray.200" bg="gray.50">
        {!isSelected ? (
          <Text fontSize="sm" color="gray.500">
            Select a division option above to enable pre-payment.
          </Text>
        ) : (
          <Stack spacing={2}>
            <HStack align="end" wrap="wrap" gap={3}>
              <Checkbox
                isChecked={prepayEnabled}
                onChange={(event) =>
                  onPrepayEnabledChange(event.target.checked)
                }
                isDisabled={isDisabled}
                colorScheme="green"
              >
                Pre-pay this division ${prepayEntryFee}/entry
              </Checkbox>
              <Input
                size="sm"
                type="number"
                min={0}
                max={maxPrepayCount}
                step={1}
                w="72px"
                textAlign="center"
                value={prepayCount}
                aria-label={`${title} prepay count`}
                isDisabled={!prepayEnabled || isDisabled}
                onChange={(event) => {
                  const rawValue = Number(event.target.value);
                  const safeValue = Number.isNaN(rawValue)
                    ? 0
                    : Math.max(
                        0,
                        Math.min(Math.floor(rawValue), maxPrepayCount),
                      );
                  onPrepayCountChange(safeValue);
                }}
              />
            </HStack>

            <Text fontSize="xs" color="gray.600">
              Pre-pay {prepayFreeEntryThreshold} entries and get 1 free.
            </Text>
          </Stack>
        )}
      </Box>
    </Box>
  );
}

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
  const [selectedSeniorsOption, setSelectedSeniorsOption] = useState("");
  const [selectedPoaOption, setSelectedPoaOption] = useState("");
  const [selectedTournamentOption, setSelectedTournamentOption] = useState("");
  const [nonParticipantSelection, setNonParticipantSelection] = useState<
    string[]
  >([]);
  const [prepaySeniors, setPrepaySeniors] = useState(false);
  const [prepayPoa, setPrepayPoa] = useState(false);
  const [prepayTournament, setPrepayTournament] = useState(false);
  const [prepaySeniorsCount, setPrepaySeniorsCount] = useState(0);
  const [prepayPoaCount, setPrepayPoaCount] = useState(0);
  const [prepayTournamentCount, setPrepayTournamentCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [submittedApplication, setSubmittedApplication] =
    useState<SubmittedMembershipSummary | null>(null);

  const API_URL = import.meta.env.VITE_API_URL;
  const API_KEY = import.meta.env.VITE_API_KEY;

  const toggleSelection = (
    value: string,
    selected: string[],
    setter: (value: string[]) => void,
  ) => {
    setter(
      selected.includes(value)
        ? selected.filter((item) => item !== value)
        : [...selected, value],
    );
  };

  const participantSelection = useMemo(
    () =>
      [
        selectedSeniorsOption,
        selectedPoaOption,
        selectedTournamentOption,
      ].filter(Boolean),
    [selectedPoaOption, selectedSeniorsOption, selectedTournamentOption],
  );

  const participantOptionsLocked =
    nonParticipantSelection.length > 0 && participantSelection.length === 0;
  const nonParticipantOptionsLocked =
    participantSelection.length > 0 && nonParticipantSelection.length === 0;

  const handleParticipantOptionToggle = (
    optionId: string,
    setter: (value: string | ((current: string) => string)) => void,
  ) => {
    setter((current) => {
      const nextValue = current === optionId ? "" : optionId;

      if (nextValue) {
        setNonParticipantSelection([]);
      }

      if (!nextValue) {
        if (setter === setSelectedSeniorsOption) {
          setPrepaySeniors(false);
          setPrepaySeniorsCount(0);
        }
        if (setter === setSelectedPoaOption) {
          setPrepayPoa(false);
          setPrepayPoaCount(0);
        }
        if (setter === setSelectedTournamentOption) {
          setPrepayTournament(false);
          setPrepayTournamentCount(0);
        }
      }

      return nextValue;
    });
  };

  const handleNonParticipantOptionToggle = (optionId: string) => {
    const isCurrentlySelected = nonParticipantSelection.includes(optionId);

    if (!isCurrentlySelected) {
      setSelectedSeniorsOption("");
      setSelectedPoaOption("");
      setSelectedTournamentOption("");
      setPrepaySeniors(false);
      setPrepayPoa(false);
      setPrepayTournament(false);
      setPrepaySeniorsCount(0);
      setPrepayPoaCount(0);
      setPrepayTournamentCount(0);
    }

    toggleSelection(
      optionId,
      nonParticipantSelection,
      setNonParticipantSelection,
    );
  };

  const participantFees = useMemo(() => {
    const allParticipantOptions = [
      ...SENIORS_FEE_OPTIONS,
      ...POA_FEE_OPTIONS,
      ...TOURNAMENT_FEE_OPTIONS,
    ];
    return sumSelectedFees(allParticipantOptions, participantSelection);
  }, [participantSelection]);

  const nonParticipantFees = useMemo(
    () => sumSelectedFees(NON_PARTICIPANT_FEE_OPTIONS, nonParticipantSelection),
    [nonParticipantSelection],
  );

  const seniorsPrepayTotals = useMemo(
    () =>
      calculateDivisionPrepay(
        prepaySeniors && selectedSeniorsOption ? prepaySeniorsCount : 0,
        SENIORS_POA_ENTRY_FEE,
        SENIORS_POA_MAX_PREPAY_COUNT,
        SENIORS_POA_FREE_ENTRY_THRESHOLD,
      ),
    [prepaySeniors, prepaySeniorsCount, selectedSeniorsOption],
  );

  const poaPrepayTotals = useMemo(
    () =>
      calculateDivisionPrepay(
        prepayPoa && selectedPoaOption ? prepayPoaCount : 0,
        SENIORS_POA_ENTRY_FEE,
        SENIORS_POA_MAX_PREPAY_COUNT,
        SENIORS_POA_FREE_ENTRY_THRESHOLD,
      ),
    [prepayPoa, prepayPoaCount, selectedPoaOption],
  );

  const tournamentPrepayTotals = useMemo(
    () =>
      calculateDivisionPrepay(
        prepayTournament && selectedTournamentOption
          ? prepayTournamentCount
          : 0,
        TOURNAMENT_DIVISION_ENTRY_FEE,
        TOURNAMENT_MAX_PREPAY_COUNT,
        TOURNAMENT_FREE_ENTRY_THRESHOLD,
      ),
    [prepayTournament, prepayTournamentCount, selectedTournamentOption],
  );

  const totalPrepayAmount =
    seniorsPrepayTotals.totalAmount +
    poaPrepayTotals.totalAmount +
    tournamentPrepayTotals.totalAmount;

  const totalAmount = participantFees + nonParticipantFees + totalPrepayAmount;

  const participantMembershipLabels = useMemo(() => {
    const selected: string[] = [];
    const selectedSeniors = SENIORS_FEE_OPTIONS.find(
      (option) => option.id === selectedSeniorsOption,
    );
    const selectedPoa = POA_FEE_OPTIONS.find(
      (option) => option.id === selectedPoaOption,
    );
    const selectedTournament = TOURNAMENT_FEE_OPTIONS.find(
      (option) => option.id === selectedTournamentOption,
    );

    if (selectedSeniors) {
      selected.push(`Seniors Division - ${selectedSeniors.label}`);
    }
    if (selectedPoa) {
      selected.push(`POA Division - ${selectedPoa.label}`);
    }
    if (selectedTournament) {
      selected.push(`Tournament Division - ${selectedTournament.label}`);
    }

    return selected;
  }, [selectedPoaOption, selectedSeniorsOption, selectedTournamentOption]);

  const nonParticipantMembershipLabels = useMemo(
    () =>
      getSelectedLabels(NON_PARTICIPANT_FEE_OPTIONS, nonParticipantSelection),
    [nonParticipantSelection],
  );

  const selectedSeniorsFee = useMemo(
    () =>
      SENIORS_FEE_OPTIONS.find((option) => option.id === selectedSeniorsOption),
    [selectedSeniorsOption],
  );

  const selectedPoaFee = useMemo(
    () => POA_FEE_OPTIONS.find((option) => option.id === selectedPoaOption),
    [selectedPoaOption],
  );

  const selectedTournamentFee = useMemo(
    () =>
      TOURNAMENT_FEE_OPTIONS.find(
        (option) => option.id === selectedTournamentOption,
      ),
    [selectedTournamentOption],
  );

  const selectedNonParticipantFees = useMemo(
    () =>
      NON_PARTICIPANT_FEE_OPTIONS.filter((option) =>
        nonParticipantSelection.includes(option.id),
      ),
    [nonParticipantSelection],
  );

  const playingMoreThanOneDivision = useMemo(
    () => participantSelection.length > 1,
    [participantSelection],
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);

    if (!name || !email || !phone || !address || !city || !postalCode) {
      setSubmitError(
        "Please fill in all required applicant information fields.",
      );
      return;
    }

    if (
      participantSelection.length === 0 &&
      nonParticipantSelection.length === 0
    ) {
      setSubmitError("Please select at least one membership fee option.");
      return;
    }

    if (prepaySeniors && prepaySeniorsCount < 1) {
      setSubmitError("Enter the number of Seniors entries to pre-pay.");
      return;
    }

    if (prepayPoa && prepayPoaCount < 1) {
      setSubmitError("Enter the number of POA entries to pre-pay.");
      return;
    }

    if (prepayTournament && prepayTournamentCount < 1) {
      setSubmitError("Enter the number of Tournament entries to pre-pay.");
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
      selectedSeniorsOption
        ? prepaySeniors
          ? `Seniors prepay: ${seniorsPrepayTotals.prepayCount} at $${SENIORS_POA_ENTRY_FEE} (free: ${seniorsPrepayTotals.freeEntries})`
          : "Seniors prepay: no"
        : null,
      selectedPoaOption
        ? prepayPoa
          ? `POA prepay: ${poaPrepayTotals.prepayCount} at $${SENIORS_POA_ENTRY_FEE} (free: ${poaPrepayTotals.freeEntries})`
          : "POA prepay: no"
        : null,
      selectedTournamentOption
        ? prepayTournament
          ? `Tournament prepay: ${tournamentPrepayTotals.prepayCount} at $${TOURNAMENT_DIVISION_ENTRY_FEE} (free: ${tournamentPrepayTotals.freeEntries})`
          : "Tournament prepay: no"
        : null,
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
          productName: `${name} 2026/2027 Application`,
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
        entryPrepayAmount: `$${totalPrepayAmount.toFixed(2)}`,
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
      setSelectedSeniorsOption("");
      setSelectedPoaOption("");
      setSelectedTournamentOption("");
      setNonParticipantSelection([]);
      setPrepaySeniors(false);
      setPrepayPoa(false);
      setPrepayTournament(false);
      setPrepaySeniorsCount(0);
      setPrepayPoaCount(0);
      setPrepayTournamentCount(0);
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
    <Layout title="2026/2027 Membership Application Form">
      <Container maxW="3xl" py={0}>
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
                  onChange={(event) =>
                    setIsCommunityCoach(event.target.checked)
                  }
                  colorScheme="green"
                  disabled={isSubmitting}
                >
                  Community Coach
                </Checkbox>
                <Checkbox
                  isChecked={isCompetitiveCoach}
                  onChange={(event) =>
                    setIsCompetitiveCoach(event.target.checked)
                  }
                  colorScheme="green"
                  disabled={isSubmitting}
                >
                  Competitive Coach
                </Checkbox>
              </Stack>
            </FormControl>
          </SimpleGrid>

          <Divider my={6} />

          <HStack mb={4} justify="space-between" align="center">
            <Heading size="md" mb={0}>
              Membership Fees for Participants
            </Heading>
            <Link
              href={FEE_SCHEDULE_URL}
              isExternal
              fontSize="sm"
              color="green.700"
              fontWeight="600"
            >
              Fee Schedule
            </Link>
          </HStack>

          <Stack spacing={4}>
            <DivisionFeeGroupCard
              title="Seniors Division"
              options={SENIORS_FEE_OPTIONS}
              selectedOptionId={selectedSeniorsOption}
              isSelected={Boolean(selectedSeniorsOption)}
              prepayEnabled={prepaySeniors}
              prepayCount={prepaySeniorsCount}
              prepayEntryFee={SENIORS_POA_ENTRY_FEE}
              maxPrepayCount={SENIORS_POA_MAX_PREPAY_COUNT}
              prepayFreeEntryThreshold={SENIORS_POA_FREE_ENTRY_THRESHOLD}
              onPrepayEnabledChange={(enabled) => {
                setPrepaySeniors(enabled);
                if (!enabled) {
                  setPrepaySeniorsCount(0);
                }
              }}
              onPrepayCountChange={setPrepaySeniorsCount}
              onToggleOption={(optionId) =>
                handleParticipantOptionToggle(
                  optionId,
                  setSelectedSeniorsOption,
                )
              }
              isDisabled={isSubmitting || participantOptionsLocked}
            />

            <DivisionFeeGroupCard
              title="POA Division"
              options={POA_FEE_OPTIONS}
              selectedOptionId={selectedPoaOption}
              isSelected={Boolean(selectedPoaOption)}
              prepayEnabled={prepayPoa}
              prepayCount={prepayPoaCount}
              prepayEntryFee={SENIORS_POA_ENTRY_FEE}
              maxPrepayCount={SENIORS_POA_MAX_PREPAY_COUNT}
              prepayFreeEntryThreshold={SENIORS_POA_FREE_ENTRY_THRESHOLD}
              onPrepayEnabledChange={(enabled) => {
                setPrepayPoa(enabled);
                if (!enabled) {
                  setPrepayPoaCount(0);
                }
              }}
              onPrepayCountChange={setPrepayPoaCount}
              onToggleOption={(optionId) =>
                handleParticipantOptionToggle(optionId, setSelectedPoaOption)
              }
              isDisabled={isSubmitting || participantOptionsLocked}
            />

            <DivisionFeeGroupCard
              title="Tournament Division"
              options={TOURNAMENT_FEE_OPTIONS}
              selectedOptionId={selectedTournamentOption}
              isSelected={Boolean(selectedTournamentOption)}
              prepayEnabled={prepayTournament}
              prepayCount={prepayTournamentCount}
              prepayEntryFee={TOURNAMENT_DIVISION_ENTRY_FEE}
              maxPrepayCount={TOURNAMENT_MAX_PREPAY_COUNT}
              prepayFreeEntryThreshold={TOURNAMENT_FREE_ENTRY_THRESHOLD}
              onPrepayEnabledChange={(enabled) => {
                setPrepayTournament(enabled);
                if (!enabled) {
                  setPrepayTournamentCount(0);
                }
              }}
              onPrepayCountChange={setPrepayTournamentCount}
              onToggleOption={(optionId) =>
                handleParticipantOptionToggle(
                  optionId,
                  setSelectedTournamentOption,
                )
              }
              isDisabled={isSubmitting || participantOptionsLocked}
            />
          </Stack>

          {participantOptionsLocked && (
            <Text mt={2} fontSize="sm" color="gray.600">
              Clear non-participant selections to choose a participant division.
            </Text>
          )}

          <Checkbox mt={4} isChecked={playingMoreThanOneDivision} isReadOnly>
            Playing in more than one division
          </Checkbox>

          <Box
            mt={3}
            px={3}
            py={2}
            bg="yellow.50"
            border="1px"
            borderColor="yellow.200"
            rounded="md"
          >
            <Text fontSize="sm" color="gray.700">
              If you join more than one division, you are required to pay entry
              fees for each division.
            </Text>
          </Box>

          <Divider my={6} />

          <Heading size="md" mb={4}>
            Membership Fees for Non-Participants
          </Heading>
          <FeeOptionChecklist
            options={NON_PARTICIPANT_FEE_OPTIONS}
            selectedOptionIds={nonParticipantSelection}
            onToggleOption={handleNonParticipantOptionToggle}
            isDisabled={isSubmitting || nonParticipantOptionsLocked}
          />
          <Divider my={6} />

          <Heading size="md" mb={4}>
            Summary
          </Heading>

          <Box
            bg="white"
            border="1px"
            borderColor="gray.200"
            rounded="md"
            p={4}
          >
            <Stack spacing={2}>
              {!selectedSeniorsFee &&
                !selectedPoaFee &&
                !selectedTournamentFee &&
                selectedNonParticipantFees.length === 0 && (
                  <Text fontSize="sm" color="gray.500">
                    No membership fee selections yet.
                  </Text>
                )}

              {selectedSeniorsFee && (
                <HStack justify="space-between" align="start">
                  <Text fontSize="sm">
                    Seniors Division - {selectedSeniorsFee.label}
                  </Text>
                  <Text fontSize="sm" fontWeight="600">
                    ${selectedSeniorsFee.amount.toFixed(2)}
                  </Text>
                </HStack>
              )}

              {selectedPoaFee && (
                <HStack justify="space-between" align="start">
                  <Text fontSize="sm">
                    POA Division - {selectedPoaFee.label}
                  </Text>
                  <Text fontSize="sm" fontWeight="600">
                    ${selectedPoaFee.amount.toFixed(2)}
                  </Text>
                </HStack>
              )}

              {selectedTournamentFee && (
                <HStack justify="space-between" align="start">
                  <Text fontSize="sm">
                    Tournament Division - {selectedTournamentFee.label}
                  </Text>
                  <Text fontSize="sm" fontWeight="600">
                    ${selectedTournamentFee.amount.toFixed(2)}
                  </Text>
                </HStack>
              )}

              {selectedNonParticipantFees.map((option) => (
                <HStack key={option.id} justify="space-between" align="start">
                  <Text fontSize="sm">Non-Participant - {option.label}</Text>
                  <Text fontSize="sm" fontWeight="600">
                    ${option.amount.toFixed(2)}
                  </Text>
                </HStack>
              ))}

              <Divider my={1} />

              {seniorsPrepayTotals.prepayCount > 0 && (
                <HStack justify="space-between" align="start">
                  <Text fontSize="sm" color="gray.700">
                    Seniors Entry Pre-Payment ({seniorsPrepayTotals.prepayCount}{" "}
                    x ${SENIORS_POA_ENTRY_FEE})
                  </Text>
                  <Text fontSize="sm" fontWeight="600">
                    ${seniorsPrepayTotals.rawAmount.toFixed(2)}
                  </Text>
                </HStack>
              )}

              {seniorsPrepayTotals.discount > 0 && (
                <HStack justify="space-between">
                  <Text fontSize="sm" color="green.700">
                    Seniors Prepay Discount ({seniorsPrepayTotals.freeEntries}{" "}
                    free entry)
                  </Text>
                  <Text fontSize="sm" fontWeight="700" color="green.700">
                    -${seniorsPrepayTotals.discount.toFixed(2)}
                  </Text>
                </HStack>
              )}

              {poaPrepayTotals.prepayCount > 0 && (
                <HStack justify="space-between" align="start">
                  <Text fontSize="sm" color="gray.700">
                    POA Entry Pre-Payment ({poaPrepayTotals.prepayCount} x $
                    {SENIORS_POA_ENTRY_FEE})
                  </Text>
                  <Text fontSize="sm" fontWeight="600">
                    ${poaPrepayTotals.rawAmount.toFixed(2)}
                  </Text>
                </HStack>
              )}

              {poaPrepayTotals.discount > 0 && (
                <HStack justify="space-between">
                  <Text fontSize="sm" color="green.700">
                    POA Prepay Discount ({poaPrepayTotals.freeEntries} free
                    entry)
                  </Text>
                  <Text fontSize="sm" fontWeight="700" color="green.700">
                    -${poaPrepayTotals.discount.toFixed(2)}
                  </Text>
                </HStack>
              )}

              {tournamentPrepayTotals.prepayCount > 0 && (
                <HStack justify="space-between" align="start">
                  <Text fontSize="sm" color="gray.700">
                    Tournament Entry Pre-Payment (
                    {tournamentPrepayTotals.prepayCount} x $
                    {TOURNAMENT_DIVISION_ENTRY_FEE})
                  </Text>
                  <Text fontSize="sm" fontWeight="600">
                    ${tournamentPrepayTotals.rawAmount.toFixed(2)}
                  </Text>
                </HStack>
              )}

              {tournamentPrepayTotals.discount > 0 && (
                <HStack justify="space-between">
                  <Text fontSize="sm" color="green.700">
                    Tournament Prepay Discount (
                    {tournamentPrepayTotals.freeEntries} free entry)
                  </Text>
                  <Text fontSize="sm" fontWeight="700" color="green.700">
                    -${tournamentPrepayTotals.discount.toFixed(2)}
                  </Text>
                </HStack>
              )}

              <Divider my={1} />

              <HStack justify="space-between">
                <Text fontSize="sm" color="gray.700">
                  Membership Fees Subtotal
                </Text>
                <Text fontSize="sm" fontWeight="600">
                  ${(participantFees + nonParticipantFees).toFixed(2)}
                </Text>
              </HStack>

              <HStack justify="space-between">
                <Text fontSize="sm" color="gray.700">
                  Entry Pre-Payment Subtotal
                </Text>
                <Text fontSize="sm" fontWeight="600">
                  ${totalPrepayAmount.toFixed(2)}
                </Text>
              </HStack>

              <Divider my={1} />

              <HStack justify="space-between">
                <Text fontWeight="700">Total Owing</Text>
                <Text fontWeight="700" fontSize="lg">
                  ${totalAmount.toFixed(2)}
                </Text>
              </HStack>
            </Stack>
          </Box>

          <Box
            mt={6}
            p={4}
            border="1px"
            borderColor="gray.200"
            rounded="md"
            bg="white"
          >
            <Text fontWeight="700" mb={1}>
              Payment methods accepted
            </Text>
            <Text fontSize="sm" color="gray.700">
              Cheque, cash (in person only), or e-transfer to {PAYMENT_EMAIL}.
            </Text>
            <Text fontSize="sm" color="gray.700">
              NSF cheque policy: replacement NSF cheque will require an
              additional $25.00.
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
                    label: "Entry pre-payment",
                    value: submittedApplication.entryPrepayAmount,
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
