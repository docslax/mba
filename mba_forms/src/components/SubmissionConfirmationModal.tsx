import {
  Box,
  Button,
  Divider,
  ListItem,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  UnorderedList,
} from "@chakra-ui/react";

type SummaryItem = {
  label: string;
  value: string;
};

type SubmissionConfirmationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  summaryItems: SummaryItem[];
  nextSteps: string[];
};

export default function SubmissionConfirmationModal({
  isOpen,
  onClose,
  title,
  subtitle,
  summaryItems,
  nextSteps,
}: SubmissionConfirmationModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      closeOnEsc={false}
      closeOnOverlayClick={false}
      isCentered
      size="lg"
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{title}</ModalHeader>
        <ModalCloseButton />

        <ModalBody>
          {subtitle ? (
            <Text color="gray.700" mb={4}>
              {subtitle}
            </Text>
          ) : null}

          <Box mb={4}>
            {summaryItems.map((item) => (
              <Text key={item.label} mb={1}>
                <Text as="span" fontWeight="bold">
                  {item.label}:
                </Text>
                {item.value}
              </Text>
            ))}
          </Box>

          <Divider mb={4} />

          <Text fontWeight="bold" mb={2}>
            Next steps
          </Text>
          <UnorderedList ml={5} spacing={2}>
            {nextSteps.map((step) => (
              <ListItem key={step}>{step}</ListItem>
            ))}
          </UnorderedList>
        </ModalBody>

        <ModalFooter>
          <Button colorScheme="blue" onClick={onClose}>
            Got it
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
