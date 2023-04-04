import {
  BaseError,
  IBaseResult,
  ISignBytesResult,
} from '@agoralabs-sh/algorand-provider';
import {
  Code,
  CreateToastFnReturn,
  HStack,
  Icon,
  TabPanel,
  Text,
  Textarea,
  VStack,
} from '@chakra-ui/react';
import { encodeURLSafe as encodeBase64Url } from '@stablelib/base64';
import { verifyBytes } from 'algosdk';
import React, { ChangeEvent, FC, useState } from 'react';
import { IoCheckmarkCircleSharp, IoCloseCircleSharp } from 'react-icons/io5';
import { v4 as uuid } from 'uuid';

// Components
import Button from '../src/components/Button';

// Types
import { IWindow } from '../src/types';

// Utils
import { isValidJwt } from './utils';
import { encode as encodeHex } from '@stablelib/hex';

interface IProps {
  signer: string | null;
  toast: CreateToastFnReturn;
}

function createSignatureToSign(header: string, payload: string): Uint8Array {
  const encoder: TextEncoder = new TextEncoder();
  const rawHeader: Uint8Array = encoder.encode(
    JSON.stringify(JSON.parse(header))
  );
  const rawPayload: Uint8Array = encoder.encode(
    JSON.stringify(JSON.parse(payload))
  );

  return encoder.encode(
    `${encodeBase64Url(rawHeader)}.${encodeBase64Url(rawPayload)}`
  );
}

const SignJwtTab: FC<IProps> = ({ signer, toast }: IProps) => {
  const [header, setHeader] = useState<string | null>(null);
  const [payload, setPayload] = useState<string | null>(null);
  const [signedData, setSignedData] = useState<Uint8Array | null>(null);
  const encoder: TextEncoder = new TextEncoder();
  const handleClearClick = () => {
    setHeader('');
    setPayload('');
    setSignedData(null);
  };
  const handleSignJwtClick = (withSigner: boolean) => async () => {
    let result: IBaseResult & ISignBytesResult;

    if (
      !header ||
      !payload ||
      (withSigner && !signer) ||
      !isValidJwt(header, payload)
    ) {
      console.error('no data/address or the jwt is invalid');

      return;
    }

    if (!(window as IWindow).algorand) {
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
      result = await (window as IWindow).algorand.signBytes({
        data: createSignatureToSign(header, payload),
        ...(withSigner && {
          signer: signer || undefined,
        }),
      });

      toast({
        description: `Successfully signed JWT for wallet "${result.id}".`,
        duration: 3000,
        isClosable: true,
        status: 'success',
        title: 'JWT Signed!',
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
  const handleHeaderTextareaChange = (
    event: ChangeEvent<HTMLTextAreaElement>
  ) => setHeader(event.target.value);
  const handlePayloadTextareaChange = (
    event: ChangeEvent<HTMLTextAreaElement>
  ) => setPayload(event.target.value);
  const handleVerifySignedJWT = () => {
    let encoder: TextEncoder;
    let verifiedResult: boolean;

    if (!header || !payload || !signedData || !signer) {
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
      createSignatureToSign(header, payload),
      signedData,
      signer
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
  const handleUseJwtPreset = () => {
    const now: number = new Date().getTime(); // now in milliseconds

    setHeader(`{
  "alg": "EdDSA",
  "crv": "Ed25519",
  "typ": "JWT"
}`);
    setPayload(`{
  "aud": "${window.location.protocol}//${window.location.host}",
  "exp": ${now + 300000},
  "iat": ${now},
  "iss": "did:algo:${signer}",
  "jti": "${uuid()}",
  "gty": "did",
  "sub": "${signer}"
}`);
  };

  return (
    <TabPanel w="full">
      <VStack justifyContent="center" spacing={8} w="full">
        {/* Header */}
        <VStack alignItems="flex-start" spacing={2} w="full">
          <Text>Header:</Text>
          <Textarea
            onChange={handleHeaderTextareaChange}
            placeholder={`A valid JWT header, e.g.:
{
  "alg": "EdDSA",
  "crv": "Ed25519",
  "typ": "JWT"
}
            `}
            rows={5}
            value={header || ''}
          />
          <HStack spacing={2} w="full">
            <Text>Encoded:</Text>
            {header && (
              <Code wordBreak="break-word">
                {encodeBase64Url(
                  encoder.encode(JSON.stringify(JSON.parse(header)))
                )}
              </Code>
            )}
          </HStack>
        </VStack>
        {/* Payload */}
        <VStack alignItems="flex-start" spacing={2} w="full">
          <Text>Payload:</Text>
          <Textarea
            onChange={handlePayloadTextareaChange}
            placeholder={`A valid JWT payload, e.g.:
{
  "aud": "https://exmaple.com",
  "exp": 109282718234,
  ...
}
            `}
            rows={9}
            value={payload || ''}
          />
          <HStack spacing={2} w="full">
            <Text>Encoded:</Text>
            {payload && (
              <Code wordBreak="break-word">
                {encodeBase64Url(
                  encoder.encode(JSON.stringify(JSON.parse(payload)))
                )}
              </Code>
            )}
          </HStack>
        </VStack>
        {/* Valid */}
        <HStack spacing={2}>
          <Text>Is JWT Valid:</Text>
          {isValidJwt(header, payload) ? (
            <Icon as={IoCheckmarkCircleSharp} color="green.500" size="md" />
          ) : (
            <Icon as={IoCloseCircleSharp} color="red.500" size="md" />
          )}
        </HStack>
        {/* Signed data */}
        <HStack spacing={2} w="full">
          <Text>Encoded signed data (hex):</Text>
          {signedData && (
            <Code fontSize="sm" wordBreak="break-word">
              {encodeHex(signedData).toUpperCase()}
            </Code>
          )}
        </HStack>
        {/* CTAs */}
        <VStack justifyContent="center" spacing={3} w="full">
          <Button
            colorScheme="primary"
            minW={250}
            onClick={handleUseJwtPreset}
            size="lg"
          >
            Use JWT Preset
          </Button>
          <Button
            colorScheme="primary"
            minW={250}
            onClick={handleSignJwtClick(true)}
            size="lg"
          >
            Sign JWT
          </Button>
          <Button
            colorScheme="primary"
            minW={250}
            onClick={handleSignJwtClick(false)}
            size="lg"
          >
            Sign JWT Without Signer
          </Button>
          <Button
            colorScheme="primary"
            isDisabled={!signedData}
            minW={250}
            onClick={handleVerifySignedJWT}
            size="lg"
          >
            Verify Signed JWT
          </Button>
          <Button
            colorScheme="primary"
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

export default SignJwtTab;
