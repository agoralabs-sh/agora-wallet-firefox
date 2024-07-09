import { useState } from 'react';
import { useDispatch } from 'react-redux';

// errors
import { BaseExtensionError } from '@extension/errors';

// features
import { saveToStorageThunk as savePasskeyToStorageThunk } from '@extension/features/passkeys';

// selectors
import { useSelectLogger } from '@extension/selectors';

// services
import PasskeyService from '@extension/services/PasskeyService';
import PrivateKeyService from '@extension/services/PrivateKeyService';

// types
import type { IEncryptionState } from '@extension/components/ReEncryptKeysLoadingContent';
import type {
  IAppThunkDispatch,
  IPasskeyCredential,
  IPrivateKey,
} from '@extension/types';
import type { IAddPasskeyActionOptions, IUseAddPasskeyState } from './types';

// utils
import { reEncryptPrivateKeyItemWithPasskeyAndDelay } from './utils';

export default function useAddPasskey(): IUseAddPasskeyState {
  const _hookName = 'useAddPasskey';
  const dispatch = useDispatch<IAppThunkDispatch>();
  // selectors
  const logger = useSelectLogger();
  // states
  const [encryptionProgressState, setEncryptionProgressState] = useState<
    IEncryptionState[]
  >([]);
  const [encrypting, setEncrypting] = useState<boolean>(false);
  const [error, setError] = useState<BaseExtensionError | null>(null);
  const [passkey, setPasskey] = useState<IPasskeyCredential | null>(null);
  const [requesting, setRequesting] = useState<boolean>(false);
  // actions
  const addPasskeyAction = async ({
    deviceID,
    passkey,
    password,
  }: IAddPasskeyActionOptions) => {
    const _functionName = 'addPasskeyAction';
    let _passkey: IPasskeyCredential;
    let inputKeyMaterial: Uint8Array;
    let privateKeyItems: IPrivateKey[];
    let privateKeyService: PrivateKeyService;

    // reset the previous values
    resetAction();

    setRequesting(true);

    logger.debug(
      `${_hookName}#${_functionName}: requesting input key material from passkey "${passkey.id}"`
    );

    try {
      // fetch the encryption key material
      inputKeyMaterial = await PasskeyService.fetchInputKeyMaterialFromPasskey({
        credential: passkey,
        logger,
      });
    } catch (error) {
      logger?.debug(`${_hookName}#${_functionName}:`, error);

      setRequesting(false);

      return setError(error);
    }

    setRequesting(false);
    setEncrypting(true);

    privateKeyService = new PrivateKeyService({
      logger,
    });
    privateKeyItems = await privateKeyService.fetchAllFromStorage();

    // set the encryption state for each item to false
    setEncryptionProgressState(
      privateKeyItems.map(({ id }) => ({
        id,
        encrypted: false,
      }))
    );

    // re-encrypt each private key items with the passkey
    try {
      privateKeyItems = await Promise.all(
        privateKeyItems.map(async (privateKeyItem, index) => {
          const item = await reEncryptPrivateKeyItemWithPasskeyAndDelay({
            delay: (index + 1) * 300, // add a staggered delay for the ui to catch up
            deviceID,
            inputKeyMaterial,
            logger,
            passkey,
            password,
            privateKeyItem,
          });

          // update the encryption state
          setEncryptionProgressState((_encryptionProgressState) =>
            _encryptionProgressState.map((value) =>
              value.id === privateKeyItem.id
                ? {
                    ...value,
                    encrypted: true,
                  }
                : value
            )
          );

          return item;
        })
      );
    } catch (error) {
      logger?.debug(`${_hookName}#${_functionName}:`, error);

      setEncrypting(false);

      return setError(error);
    }

    // save the new encrypted items to storage
    await privateKeyService.saveManyToStorage(privateKeyItems);

    // save the new passkey to storage
    _passkey = await dispatch(savePasskeyToStorageThunk(passkey)).unwrap();

    logger?.debug(
      `${_hookName}#${_functionName}: successfully enabled passkey`
    );

    setPasskey(_passkey);
    setEncrypting(false);
  };
  const resetAction = () => {
    setEncryptionProgressState([]);
    setEncrypting(false);
    setError(null);
    setPasskey(null);
    setRequesting(false);
  };

  return {
    addPasskeyAction,
    encryptionProgressState,
    encrypting,
    error,
    passkey,
    requesting,
    resetAction,
  };
}
