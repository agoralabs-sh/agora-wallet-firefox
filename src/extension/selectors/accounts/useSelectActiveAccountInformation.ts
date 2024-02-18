// selectors
import useSelectSelectedNetwork from '../useSelectSelectedNetwork';
import useSelectActiveAccount from './useSelectActiveAccount';

// services
import AccountService from '@extension/services/AccountService';

// types
import type {
  IAccount,
  IAccountInformation,
  INetworkWithTransactionParams,
} from '@extension/types';

/**
 * Gets the account information associated for the active account. If no active account is found, the account
 * information for first account in the list is returned.
 * @returns {IAccountInformation | null} the account information for the active account, the account information for
 * first account in the account list or null.
 */
export default function useSelectActiveAccountInformation(): IAccountInformation | null {
  const account: IAccount | null = useSelectActiveAccount();
  const network: INetworkWithTransactionParams | null =
    useSelectSelectedNetwork();

  if (!account || !network) {
    return null;
  }

  return AccountService.extractAccountInformationForNetwork(account, network);
}
