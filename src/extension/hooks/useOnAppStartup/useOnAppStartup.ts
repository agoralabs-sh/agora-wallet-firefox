import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

// features
import {
  fetchAccountsFromStorageThunk,
  updateAccountsThunk,
} from '@extension/features/accounts';
import { fetchActiveThunk as fetchCredentialLockActiveThunk } from '@extension/features/credential-lock';
import {
  fetchFromStorageThunk as fetchNetworksFromStorageThunk,
  updateTransactionParamsForSelectedNetworkThunk,
} from '@extension/features/networks';
import { fetchFromStorageThunk as fetchPasskeyCredentialFromStorageThunk } from '@extension/features/passkeys';
import { fetchSessionsThunk } from '@extension/features/sessions';
import { fetchFromStorageThunk as fetchSettingsFromStorageThunk } from '@extension/features/settings';
import { fetchStandardAssetsFromStorageThunk } from '@extension/features/standard-assets';
import { fetchFromStorageThunk as fetchSystemInfoFromStorageThunk } from '@extension/features/system';

// types
import type {
  IBackgroundRootState,
  IAppThunkDispatch,
  IMainRootState,
} from '@extension/types';

export default function useOnAppStartup(): void {
  const dispatch =
    useDispatch<IAppThunkDispatch<IBackgroundRootState | IMainRootState>>();

  useEffect(() => {
    // fetch required data
    dispatch(fetchCredentialLockActiveThunk());
    dispatch(fetchPasskeyCredentialFromStorageThunk());
    dispatch(fetchSessionsThunk());
    dispatch(fetchStandardAssetsFromStorageThunk());
    dispatch(fetchSystemInfoFromStorageThunk());

    // fetch the settings, networks and accounts and update accordingly
    (async () => {
      const { accounts } = await dispatch(
        fetchAccountsFromStorageThunk()
      ).unwrap();
      const networks = await dispatch(fetchNetworksFromStorageThunk()).unwrap();
      const settings = await dispatch(fetchSettingsFromStorageThunk()).unwrap();
      const network =
        networks.find(
          (value) =>
            value.genesisHash === settings.general.selectedNetworkGenesisHash
        ) || null;

      if (network) {
        dispatch(
          updateAccountsThunk({
            accountIDs: accounts.map(({ id }) => id),
            informationOnly: false, // get account information
            refreshTransactions: true, // get latest transactions
          })
        );
        dispatch(updateTransactionParamsForSelectedNetworkThunk());
      }
    })();
  }, []);
}