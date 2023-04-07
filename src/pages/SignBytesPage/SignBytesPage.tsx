import {
  decodeURLSafe as decodeBase64Url,
  encode as encodeBase64,
} from '@stablelib/base64';
import React, { FC, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { InfinitySpin } from 'react-loader-spinner';

// Components
import MainPageShell from '../../components/MainPageShell';
import SignBytesModal from '../../components/SignBytesModal';

// Features
import { fetchAccountsThunk } from '../../features/accounts';
import { setSignBytesRequest } from '../../features/messages';
import { fetchSessionsThunk } from '../../features/sessions';
import { fetchSettings } from '../../features/settings';

// Selectors
import {
  useSelectAccounts,
  useSelectSelectedNetwork,
  useSelectSessions,
} from '../../selectors';

// Theme
import { theme } from '../../theme';

// Types
import { IAccount, IAppThunkDispatch, INetwork, ISession } from '../../types';

// Utils
import { getAuthorizedAddressesForHost } from '../../utils';

const SignBytesPage: FC = () => {
  const { t } = useTranslation();
  const dispatch: IAppThunkDispatch = useDispatch<IAppThunkDispatch>();
  const accounts: IAccount[] = useSelectAccounts();
  const selectedNetwork: INetwork | null = useSelectSelectedNetwork();
  const sessions: ISession[] = useSelectSessions();
  const handleSignBytesModalClose = () => dispatch(setSignBytesRequest(null));

  useEffect(() => {
    dispatch(fetchSettings());
    dispatch(fetchSessionsThunk());
  }, []);
  useEffect(() => {
    const url: URL = new URL(window.location.href);
    const encodedDataUrlSafe: string | null =
      url.searchParams.get('encodedData');
    let host: string;
    let rawDecodedData: Uint8Array;
    let tabId: number;

    if (selectedNetwork && sessions.length > 0 && encodedDataUrlSafe) {
      dispatch(fetchAccountsThunk());

      host = url.searchParams.get('host') || t<string>('labels.unknownHost');
      rawDecodedData = decodeBase64Url(encodedDataUrlSafe);
      tabId = parseInt(url.searchParams.get('tabId') || 'unknown');

      dispatch(
        setSignBytesRequest({
          appName:
            url.searchParams.get('appName') || t<string>('labels.unknownApp'),
          authorizedAddresses: getAuthorizedAddressesForHost(host, sessions),
          encodedData: encodeBase64(rawDecodedData),
          host,
          iconUrl: url.searchParams.get('iconUrl'),
          signer: url.searchParams.get('signer'),
          tabId,
        })
      );
    }
  }, [selectedNetwork, sessions]);

  return (
    <>
      <SignBytesModal onClose={handleSignBytesModalClose} />
      <MainPageShell>
        <InfinitySpin color={theme.colors.primary['500']} width="200" />
      </MainPageShell>
    </>
  );
};

export default SignBytesPage;