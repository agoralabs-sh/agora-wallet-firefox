import { encode as encodeBase64 } from '@stablelib/base64';
import { encode as encodeHex } from '@stablelib/hex';
import { TransactionType } from 'algosdk';
import React, { FC, useEffect, useState } from 'react';

// components
import KeyRegistrationTransactionModalBody from '@extension/components/KeyRegistrationTransactionModalBody';
import ApplicationTransactionContent from './ApplicationTransactionContent';
import AssetConfigTransactionContent from './AssetConfigTransactionContent';
import AssetCreateTransactionContent from './AssetCreateTransactionContent';
import AssetFreezeTransactionContent from './AssetFreezeTransactionContent';
import AssetTransferTransactionContent from './AssetTransferTransactionContent';
import PaymentTransactionContent from './PaymentTransactionContent';

// enums
import { TransactionTypeEnum } from '@extension/enums';

// selectors
import {
  useSelectAccounts,
  useSelectLogger,
  useSelectNetworkByGenesisHash,
  useSelectSettingsPreferredBlockExplorer,
  useSelectStandardAssetsByGenesisHash,
  useSelectStandardAssetsUpdating,
} from '@extension/selectors';

// services
import AccountService from '@extension/services/AccountService';

// types
import type {
  IAccountWithExtendedProps,
  IAccountInformation,
} from '@extension/types';
import type { ISingleTransactionContentProps } from './types';

// utils
import parseTransactionType from '@extension/utils/parseTransactionType';
import convertGenesisHashToHex from '@extension/utils/convertGenesisHashToHex';
import updateAccountInformation from '@extension/utils/updateAccountInformation';

const SingleTransactionContent: FC<ISingleTransactionContentProps> = ({
  transaction,
}) => {
  const encodedGenesisHash = encodeBase64(transaction.genesisHash);
  // selectors
  const accounts = useSelectAccounts();
  const logger = useSelectLogger();
  const network = useSelectNetworkByGenesisHash(encodedGenesisHash);
  const preferredExplorer = useSelectSettingsPreferredBlockExplorer();
  const standardAssets =
    useSelectStandardAssetsByGenesisHash(encodedGenesisHash);
  const updatingStandardAssets = useSelectStandardAssetsUpdating();
  // states
  const [fetchingAccountInformation, setFetchingAccountInformation] =
    useState<boolean>(false);
  const [fromAccount, setFromAccount] =
    useState<IAccountWithExtendedProps | null>(null);
  // misc
  const blockExplorer =
    network?.blockExplorers.find(
      (value) => value.id === preferredExplorer?.id
    ) ||
    network?.blockExplorers[0] ||
    null; // get the preferred explorer, if it exists in the network, otherwise get the default one
  const standardAsset =
    standardAssets.find(
      (value) => value.id === String(transaction?.assetIndex)
    ) || null;
  const transactionType = parseTransactionType(
    transaction.get_obj_for_encoding(),
    {
      network,
      sender: fromAccount,
    }
  );

  // fetch account information for the from account
  useEffect(() => {
    (async () => {
      const _functionName = 'useEffect';
      const encodedPublicKey = encodeHex(transaction.from.publicKey);
      let account: IAccountWithExtendedProps | null =
        accounts.find(
          (value) =>
            value.publicKey.toUpperCase() === encodedPublicKey.toUpperCase()
        ) || null;
      let accountInformation: IAccountInformation;
      let encodedGenesisHash: string;

      // if we have this account, use it
      if (account) {
        setFromAccount(account);

        return;
      }

      if (!network) {
        logger.debug(
          `${SingleTransactionContent.name}#${_functionName}: unable to find network for genesis id "${transaction.genesisID}"`
        );

        return;
      }

      setFetchingAccountInformation(true);

      account = {
        ...AccountService.initializeDefaultAccount({
          publicKey: encodedPublicKey,
        }),
        watchAccount: true,
      };
      encodedGenesisHash = convertGenesisHashToHex(
        network.genesisHash
      ).toUpperCase();
      accountInformation = await updateAccountInformation({
        address:
          AccountService.convertPublicKeyToAlgorandAddress(encodedPublicKey),
        currentAccountInformation:
          account.networkInformation[encodedGenesisHash] ||
          AccountService.initializeDefaultAccountInformation(),
        logger,
        network,
      });

      setFromAccount({
        ...account,
        networkInformation: {
          ...account.networkInformation,
          [encodedGenesisHash]: accountInformation,
        },
      });
      setFetchingAccountInformation(false);
    })();
  }, []);

  if (!network) {
    return null;
  }

  if (!fromAccount) {
    return null;
  }

  switch (transaction.type) {
    case TransactionType.acfg:
      if (transactionType === TransactionTypeEnum.AssetCreate) {
        return (
          <AssetCreateTransactionContent
            accounts={accounts}
            blockExplorer={blockExplorer}
            fromAccount={fromAccount}
            loading={fetchingAccountInformation}
            network={network}
            transaction={transaction}
          />
        );
      }

      return (
        <AssetConfigTransactionContent
          accounts={accounts}
          asset={standardAsset}
          blockExplorer={blockExplorer}
          fromAccount={fromAccount}
          loading={fetchingAccountInformation}
          network={network}
          transaction={transaction}
        />
      );
    case TransactionType.afrz:
      return (
        <AssetFreezeTransactionContent
          accounts={accounts}
          asset={standardAsset}
          blockExplorer={blockExplorer}
          fromAccount={fromAccount}
          loading={fetchingAccountInformation}
          network={network}
          transaction={transaction}
        />
      );
    case TransactionType.appl:
      return (
        <ApplicationTransactionContent
          accounts={accounts}
          blockExplorer={blockExplorer}
          fromAccount={fromAccount}
          loading={fetchingAccountInformation}
          network={network}
          transaction={transaction}
        />
      );
    case TransactionType.axfer:
      return (
        <AssetTransferTransactionContent
          accounts={accounts}
          asset={standardAsset}
          blockExplorer={blockExplorer}
          fromAccount={fromAccount}
          loading={fetchingAccountInformation}
          network={network}
          transaction={transaction}
        />
      );
    case TransactionType.keyreg:
      return (
        <KeyRegistrationTransactionModalBody
          account={fromAccount}
          accounts={accounts}
          network={network}
          showHeader={true}
          transaction={transaction}
        />
      );
    case TransactionType.pay:
      return (
        <PaymentTransactionContent
          accounts={accounts}
          blockExplorer={blockExplorer}
          fromAccount={fromAccount}
          loading={fetchingAccountInformation}
          network={network}
          transaction={transaction}
        />
      );
    default:
      return null;
  }
};

export default SingleTransactionContent;
