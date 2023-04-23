import {
  AlgorandProvider,
  BaseError,
  IBaseResult,
  ISignBytesResult,
} from '@agoralabs-sh/algorand-provider';
import {
  Button,
  Code,
  CreateToastFnReturn,
  HStack,
  TabPanel,
  Text,
  Textarea,
  VStack,
} from '@chakra-ui/react';
import { encode as encodeHex } from '@stablelib/hex';
import { verifyBytes } from 'algosdk';
import React, { ChangeEvent, FC, useState } from 'react';

// Theme
import { theme } from '@extension/theme';

// Types
import { IWindow } from '@external/types';
import { IAccountInformation } from './types';

interface IProps {
  account: IAccountInformation | null;
  toast: CreateToastFnReturn;
}

const SignDataTab: FC<IProps> = ({ account, toast }: IProps) => {
  const [dataToSign, setDataToSign] = useState<string | null>(null);
  const [signedData, setSignedData] = useState<Uint8Array | null>(null);
  const encoder: TextEncoder = new TextEncoder();
  const handleClearClick = () => {
    setDataToSign('');
    setSignedData(null);
  };
  const handleSignDataClick = (withSigner: boolean) => async () => {
    const algorand: AlgorandProvider | undefined = (window as IWindow).algorand;
    let result: IBaseResult & ISignBytesResult;

    if (!dataToSign || (withSigner && !account)) {
      console.error('no data or address');

      return;
    }

    if (!algorand) {
      toast({
        description:
          'Algorand Provider has been intialized; there is no supported wallet.',
        duration: 3000,
        isClosable: true,
        status: 'error',
        title: 'window.algorand Not Found!',
      });

      return;
    }

    try {
      result = await algorand.signBytes({
        data: encoder.encode(dataToSign),
        ...(withSigner && {
          signer: account?.address || undefined,
        }),
      });

      toast({
        description: `Successfully signed data for wallet "${result.id}".`,
        duration: 3000,
        isClosable: true,
        status: 'success',
        title: 'Data Signed!',
      });

      setSignedData(result.signature);
    } catch (error) {
      toast({
        description: (error as BaseError).message,
        duration: 3000,
        isClosable: true,
        status: 'error',
        title: `${(error as BaseError).code}: ${(error as BaseError).name}`,
      });
    }
  };
  const handleTextareaOnChange = (event: ChangeEvent<HTMLTextAreaElement>) =>
    setDataToSign(event.target.value);
  const handleVerifySignedData = () => {
    let encoder: TextEncoder;
    let verifiedResult: boolean;

    if (!dataToSign || !signedData || !account) {
      toast({
        duration: 3000,
        isClosable: true,
        status: 'error',
        title: 'No Data To Verify!',
      });

      return;
    }

    encoder = new TextEncoder();
    verifiedResult = verifyBytes(
      encoder.encode(dataToSign),
      signedData,
      account.address
    ); // verify using the algosdk

    if (!verifiedResult) {
      toast({
        description: 'The signed data failed verification',
        duration: 3000,
        isClosable: true,
        status: 'error',
        title: 'Signed Data is Invalid!',
      });

      return;
    }

    toast({
      description: 'The signed data has been verified.',
      duration: 3000,
      isClosable: true,
      status: 'success',
      title: 'Signed Data is Valid!',
    });
  };

  return (
    <TabPanel w="full">
      <VStack justifyContent="center" spacing={8} w="full">
        <Textarea
          onChange={handleTextareaOnChange}
          placeholder="Add data to be signed"
          value={dataToSign || ''}
        />
        <HStack spacing={2} w="full">
          <Text>Encoded signed data (hex):</Text>
          {signedData && (
            <Code fontSize="sm" wordBreak="break-word">
              {encodeHex(signedData).toUpperCase()}
            </Code>
          )}
        </HStack>
        <VStack justifyContent="center" spacing={3} w="full">
          <Button
            borderRadius={theme.radii['3xl']}
            colorScheme="primaryLight"
            minW={250}
            onClick={handleSignDataClick(true)}
            size="lg"
          >
            Sign Data
          </Button>
          <Button
            borderRadius={theme.radii['3xl']}
            colorScheme="primaryLight"
            minW={250}
            onClick={handleSignDataClick(false)}
            size="lg"
          >
            Sign Data Without Signer
          </Button>
          <Button
            borderRadius={theme.radii['3xl']}
            colorScheme="primaryLight"
            isDisabled={!signedData}
            minW={250}
            onClick={handleVerifySignedData}
            size="lg"
          >
            Verify Signed Data
          </Button>
          <Button
            borderRadius={theme.radii['3xl']}
            colorScheme="primaryLight"
            minW={250}
            onClick={handleClearClick}
            size="lg"
            variant="outline"
          >
            Clear
          </Button>
        </VStack>
      </VStack>
    </TabPanel>
  );
};

export default SignDataTab;
