import { AsyncThunk, createAsyncThunk } from '@reduxjs/toolkit';

// enums
import { EncryptionMethodEnum } from '@extension/enums';
import { ThunkEnum } from '../enums';

// errors
import { DecryptionError } from '@extension/errors';

// services
import PasskeyService from '@extension/services/PasskeyService';
import PasswordService from '@extension/services/PasswordService';
import PrivateKeyService from '@extension/services/PrivateKeyService';

// types
import type {
  IAsyncThunkConfigWithRejectValue,
  IBackgroundRootState,
  IMainRootState,
  IPasskeyEncryptionCredentials,
  IPasswordEncryptionCredentials,
} from '@extension/types';

// utils
import convertPublicKeyToAVMAddress from '@extension/utils/convertPublicKeyToAVMAddress';

/**
 * Decrypts all the private keys and creates a credential lock alarm.
 */
const enableThunk: AsyncThunk<
  void, // return
  IPasskeyEncryptionCredentials | IPasswordEncryptionCredentials, // args
  IAsyncThunkConfigWithRejectValue<IBackgroundRootState | IMainRootState>
> = createAsyncThunk<
  void,
  IPasskeyEncryptionCredentials | IPasswordEncryptionCredentials,
  IAsyncThunkConfigWithRejectValue<IBackgroundRootState | IMainRootState>
>(ThunkEnum.Enable, async (credentials, { getState, rejectWithValue }) => {
  const logger = getState().system.logger;
  const privateKeyService = new PrivateKeyService({
    logger,
  });
  let privateKeyItems = await privateKeyService.fetchAllFromStorage();

  try {
    privateKeyItems = await Promise.all(
      privateKeyItems.map(async (value) => {
        const privateKeyItem = await PrivateKeyService.upgrade({
          encryptionCredentials: credentials,
          logger,
          privateKeyItem: value,
        });
        let decryptedPrivateKey: Uint8Array | null = null;

        if (credentials.type === EncryptionMethodEnum.Password) {
          decryptedPrivateKey = await PasswordService.decryptBytes({
            data: PrivateKeyService.decode(privateKeyItem.encryptedPrivateKey),
            logger,
            password: credentials.password,
          });
        }

        if (credentials.type === EncryptionMethodEnum.Passkey) {
          decryptedPrivateKey = await PasskeyService.decryptBytes({
            encryptedBytes: PrivateKeyService.decode(
              privateKeyItem.encryptedPrivateKey
            ),
            inputKeyMaterial: credentials.inputKeyMaterial,
            logger,
            passkey: credentials.passkey,
          });
        }

        if (!decryptedPrivateKey) {
          throw new DecryptionError(
            `failed to decrypt private key for account "${convertPublicKeyToAVMAddress(
              value.publicKey
            )}"`
          );
        }

        return {
          ...privateKeyItem,
          privateKey: PrivateKeyService.encode(decryptedPrivateKey),
        };
      })
    );
  } catch (error) {
    logger.error(`${ThunkEnum.Enable}:`, error);

    return rejectWithValue(error);
  }

  logger.debug(
    `${ThunkEnum.Enable}: decrypted ${privateKeyItems.length} private keys`
  );

  await privateKeyService.saveManyToStorage(privateKeyItems);

  logger.debug(`${ThunkEnum.Enable}: saved decrypted private keys to storage`);

  return;
});

export default enableThunk;