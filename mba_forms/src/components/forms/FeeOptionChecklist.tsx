import {
  Box,
  Checkbox,
  HStack,
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/react";

export type FeeOption = {
  id: string;
  label: string;
  amount: number;
};

type FeeOptionChecklistProps = {
  options: FeeOption[];
  selectedOptionIds: string[];
  onToggleOption: (optionId: string) => void;
  isDisabled?: boolean;
};

export default function FeeOptionChecklist({
  options,
  selectedOptionIds,
  onToggleOption,
  isDisabled,
}: FeeOptionChecklistProps) {
  return (
    <SimpleGrid columns={[1, 1, 2]} spacing={3}>
      {options.map((option) => {
        const isChecked = selectedOptionIds.includes(option.id);

        return (
          <Box
            key={option.id}
            border="1px"
            borderColor={isChecked ? "green.300" : "gray.200"}
            bg={isChecked ? "green.50" : "white"}
            rounded="md"
            p={3}
          >
            <HStack align="start" justify="space-between" spacing={3}>
              <Checkbox
                isChecked={isChecked}
                onChange={() => onToggleOption(option.id)}
                isDisabled={isDisabled}
                colorScheme="green"
                flex="1"
              >
                <Stack spacing={0}>
                  <Text fontWeight="600" fontSize="sm">
                    {option.label}
                  </Text>
                </Stack>
              </Checkbox>
              <Text fontWeight="700" whiteSpace="nowrap">
                ${option.amount.toFixed(2)}
              </Text>
            </HStack>
          </Box>
        );
      })}
    </SimpleGrid>
  );
}