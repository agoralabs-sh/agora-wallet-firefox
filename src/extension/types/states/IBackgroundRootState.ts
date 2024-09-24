// features
import type { IState as IAccountsState } from '@extension/features/accounts';
import type { IState as IARC0200AssetsState } from '@extension/features/arc0200-assets';
import type { IState as ICredentialLockState } from '@extension/features/credential-lock';
import type { IState as IEventsState } from '@extension/features/events';
import type { IState as IPasskeysState } from '@extension/features/passkeys';
import type { IState as ISessionsState } from '@extension/features/sessions';
import type { IState as IStandardAssetsState } from '@extension/features/standard-assets';

// types
import type IBaseRootState from './IBaseRootState';

interface IBackgroundRootState extends IBaseRootState {
  accounts: IAccountsState;
  arc0200Assets: IARC0200AssetsState;
  credentialLock: ICredentialLockState;
  events: IEventsState;
  passkeys: IPasskeysState;
  sessions: ISessionsState;
  standardAssets: IStandardAssetsState;
}

export default IBackgroundRootState;
