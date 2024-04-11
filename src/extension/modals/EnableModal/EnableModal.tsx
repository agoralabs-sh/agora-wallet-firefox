import {
  IEnableParams,
  ARC0027MethodCanceledError,
} from '@agoralabs-sh/avm-web-provider';
import {
  Avatar,
  Checkbox,
  HStack,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Skeleton,
  SkeletonCircle,
  Spacer,
  Text,
  VStack,
} from '@chakra-ui/react';
import { generateAccount } from 'algosdk';
import React, { ChangeEvent, FC, ReactNode, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

// components
import Button from '@extension/components/Button';
import EmptyState from '@extension/components/EmptyState';
import SessionRequestHeader, {
  SessionRequestHeaderSkeleton,
} from '@extension/components/SessionRequestHeader';

// constants
import { DEFAULT_GAP } from '@extension/constants';

// enums
import { ARC0027ProviderMethodEnum } from '@common/enums';

// errors
import { SerializableARC0027MethodCanceledError } from '@common/errors';

// features
import { sendEnableResponseThunk } from '@extension/features/messages';
import { setSessionThunk } from '@extension/features/sessions';

// hooks
import useDefaultTextColor from '@extension/hooks/useDefaultTextColor';
import usePrimaryColorScheme from '@extension/hooks/usePrimaryColorScheme';
import useSubTextColor from '@extension/hooks/useSubTextColor';

// selectors
import {
  useSelectAccounts,
  useSelectEnableRequest,
  useSelectFetchingAccounts,
  useSelectNetworks,
  useSelectSavingSessions,
} from '@extension/selectors';

// services
import AccountService from '@extension/services/AccountService';

// theme
import { theme } from '@extension/theme';

// types
import type {
  IAccount,
  IAppThunkDispatch,
  IClientRequestEventPayload,
  IEvent,
  INetwork,
  ISession,
} from '@extension/types';
import type { IProps } from './types';

// utils
import ellipseAddress from '@extension/utils/ellipseAddress';
import mapSessionFromEnableRequest from '@extension/utils/mapSessionFromEnableRequest';
import selectDefaultNetwork from '@extension/utils/selectDefaultNetwork';

const EnableModal: FC<IProps> = ({ onClose }: IProps) => {
  const { t } = useTranslation();
  const dispatch: IAppThunkDispatch = useDispatch<IAppThunkDispatch>();
  // selectors
  const accounts: IAccount[] = useSelectAccounts();
  const enableRequestEvent: IEvent<
    IClientRequestEventPayload<IEnableParams>
  > | null = useSelectEnableRequest();
  const fetching: boolean = useSelectFetchingAccounts();
  const networks: INetwork[] = useSelectNetworks();
  const saving: boolean = useSelectSavingSessions();
  // hooks
  const defaultTextColor: string = useDefaultTextColor();
  const primaryColorScheme: string = usePrimaryColorScheme();
  const subTextColor: string = useSubTextColor();
  // state
  const [authorizedAddresses, setAuthorizedAddresses] = useState<string[]>([]);
  const [network, setNetwork] = useState<INetwork | null>(null);
  // handlers
  const handleCancelClick = () => {
    if (enableRequestEvent) {
      dispatch(
        sendEnableResponseThunk({
          error: new ARC0027MethodCanceledError({
            message: `user dismissed connect modal`,
            method: ARC0027ProviderMethodEnum.Enable,
            providerId: __PROVIDER_ID__,
          }),
          event: enableRequestEvent,
          session: null,
        })
      );
    }

    handleClose();
  };
  const handleClose = () => {
    setAuthorizedAddresses([]);
    setNetwork(null);
    onClose();
  };
  const handleConnectClick = () => {
    let session: ISession;

    if (!enableRequestEvent || !network || authorizedAddresses.length <= 0) {
      return;
    }

    session = mapSessionFromEnableRequest({
      authorizedAddresses,
      clientInfo: enableRequestEvent.payload.message.clientInfo,
      network,
    });

    // save the session, send an enable response and remove the connect request
    dispatch(setSessionThunk(session));
    dispatch(
      sendEnableResponseThunk({
        error: null,
        event: enableRequestEvent,
        session,
      })
    );

    handleClose();
  };
  const handleOnAccountCheckChange =
    (address: string) => (event: ChangeEvent<HTMLInputElement>) => {
      if (!event) {
        return;
      }

      if (event.target.checked) {
        if (!authorizedAddresses.find((value) => value === address)) {
          setAuthorizedAddresses([...authorizedAddresses, address]);
        }

        return;
      }

      // remove if unchecked
      setAuthorizedAddresses(
        authorizedAddresses.filter((value) => value !== address)
      );
    };
  const renderContent = () => {
    let accountNodes: ReactNode[];

    if (!enableRequestEvent || fetching) {
      return Array.from({ length: 3 }, (_, index) => (
        <HStack
          key={`enable-modal-fetching-item-${index}`}
          py={4}
          spacing={4}
          w="full"
        >
          <SkeletonCircle size="12" />
          <Skeleton flexGrow={1}>
            <Text color={defaultTextColor} fontSize="md" textAlign="center">
              {ellipseAddress(generateAccount().addr, {
                end: 10,
                start: 10,
              })}
            </Text>
          </Skeleton>
        </HStack>
      ));
    }

    accountNodes = accounts.reduce<ReactNode[]>(
      (acc, account, currentIndex) => {
        const address: string =
          AccountService.convertPublicKeyToAlgorandAddress(account.publicKey);

        return [
          ...acc,
          <HStack
            key={`enable-modal-account-information-${currentIndex}`}
            py={4}
            spacing={4}
            w="full"
          >
            <Avatar name={account.name || address} />
            {account.name ? (
              <VStack
                alignItems="flex-start"
                flexGrow={1}
                justifyContent="space-evenly"
                spacing={0}
              >
                <Text color={defaultTextColor} fontSize="md" textAlign="left">
                  {account.name}
                </Text>
                <Text color={subTextColor} fontSize="sm" textAlign="left">
                  {ellipseAddress(address, {
                    end: 10,
                    start: 10,
                  })}
                </Text>
              </VStack>
            ) : (
              <Text
                color={defaultTextColor}
                flexGrow={1}
                fontSize="md"
                textAlign="left"
              >
                {ellipseAddress(address, {
                  end: 10,
                  start: 10,
                })}
              </Text>
            )}
            <Checkbox
              colorScheme={primaryColorScheme}
              isChecked={
                !!authorizedAddresses?.find((value) => value === address)
              }
              onChange={handleOnAccountCheckChange(address)}
            />
          </HStack>,
        ];
      },
      []
    );

    return accountNodes.length > 0 ? (
      accountNodes
    ) : (
      <>
        {/*empty state*/}
        <Spacer />
        <EmptyState text={t<string>('headings.noAccountsFound')} />
        <Spacer />
      </>
    );
  };

  useEffect(() => {
    if (enableRequestEvent) {
      // find the selected network, or use the default one
      setNetwork(
        networks.find(
          (value) =>
            value.genesisHash ===
            enableRequestEvent.payload.message.params?.genesisHash
        ) || selectDefaultNetwork(networks)
      );

      // if the authorized addresses are empty, auto add the first address
      if (authorizedAddresses.length <= 0 && accounts.length > 0) {
        setAuthorizedAddresses([
          AccountService.convertPublicKeyToAlgorandAddress(
            accounts[0].publicKey
          ),
        ]);
      }
    }
  }, [enableRequestEvent]);

  return (
    <Modal
      isOpen={!!enableRequestEvent}
      motionPreset="slideInBottom"
      onClose={handleClose}
      size="full"
      scrollBehavior="inside"
    >
      <ModalContent
        backgroundColor="var(--chakra-colors-chakra-body-bg)"
        borderTopRadius={theme.radii['3xl']}
        borderBottomRadius={0}
      >
        <ModalHeader justifyContent="center" px={DEFAULT_GAP}>
          {enableRequestEvent ? (
            <SessionRequestHeader
              caption={t<string>('captions.enableRequest')}
              description={
                enableRequestEvent.payload.message.clientInfo.description ||
                undefined
              }
              host={enableRequestEvent.payload.message.clientInfo.host}
              iconUrl={
                enableRequestEvent.payload.message.clientInfo.iconUrl ||
                undefined
              }
              name={enableRequestEvent.payload.message.clientInfo.appName}
              network={network || undefined}
            />
          ) : (
            <SessionRequestHeaderSkeleton />
          )}
        </ModalHeader>

        <ModalBody px={DEFAULT_GAP}>{renderContent()}</ModalBody>

        <ModalFooter p={DEFAULT_GAP}>
          <HStack spacing={4} w="full">
            <Button
              onClick={handleCancelClick}
              size="lg"
              variant="outline"
              w="full"
            >
              {t<string>('buttons.cancel')}
            </Button>
            <Button
              isLoading={saving}
              onClick={handleConnectClick}
              size="lg"
              variant="solid"
              w="full"
            >
              {t<string>('buttons.allow')}
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default EnableModal;
