import { HStack, Switch, Text, VStack } from '@chakra-ui/react';
import React, { ChangeEvent, FC } from 'react';

// Constants
import { DEFAULT_GAP, SETTINGS_ITEM_HEIGHT } from '../../constants';

interface IProps {
  checked: boolean;
  description?: string;
  label: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

const SettingsSwitchItem: FC<IProps> = ({
  checked,
  description,
  label,
  onChange,
}: IProps) => (
  <HStack
    alignItems="center"
    h={SETTINGS_ITEM_HEIGHT}
    justifyContent="space-between"
    px={DEFAULT_GAP - 2}
    spacing={2}
    w="full"
  >
    <VStack alignItems="flex-start" justifyContent="center" spacing={1}>
      <Text color="gray.500" fontSize="sm">
        {label}
      </Text>
      {description && (
        <Text color="gray.400" fontSize="xs">
          {description}
        </Text>
      )}
    </VStack>
    <Switch
      colorScheme="primary"
      isChecked={checked}
      onChange={onChange}
      size="lg"
    />
  </HStack>
);

export default SettingsSwitchItem;
