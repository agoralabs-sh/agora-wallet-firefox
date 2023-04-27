import { AsyncThunk, createAsyncThunk } from '@reduxjs/toolkit';

// Constants
import {
  SETTINGS_ADVANCED_KEY,
  SETTINGS_APPEARANCE_KEY,
  SETTINGS_GENERAL_KEY,
} from '@extension/constants';

// Enums
import { NetworkTypeEnum, SettingsThunkEnum } from '@extension/enums';

// Services
import { StorageManager } from '@extension/services';

// Types
import { IMainRootState, INetwork, ISettings } from '@extension/types';

// Utils
import { selectDefaultNetwork } from '@extension/utils';

const setSettings: AsyncThunk<
  ISettings, // return
  ISettings, // args
  Record<string, never>
> = createAsyncThunk<ISettings, ISettings, { state: IMainRootState }>(
  SettingsThunkEnum.SetSettings,
  async (settings, { getState }) => {
    const storageManager: StorageManager = new StorageManager();
    const networks: INetwork[] = getState().networks.items;
    let selectedNetwork: INetwork | null =
      networks.find(
        (value) =>
          value.genesisHash === settings.general.selectedNetworkGenesisHash
      ) || null;

    // if the beta/test net has been disallowed and the selected network is one of the disallowed, set it to a stable one
    if (
      !selectedNetwork ||
      (!settings.advanced.allowBetaNet &&
        selectedNetwork.type === NetworkTypeEnum.Beta) ||
      (!settings.advanced.allowTestNet &&
        selectedNetwork.type === NetworkTypeEnum.Test)
    ) {
      selectedNetwork = selectDefaultNetwork(networks);

      settings.general.preferredBlockExplorerId =
        selectedNetwork.explorers[0]?.id || null;
      settings.general.selectedNetworkGenesisHash = selectedNetwork.genesisHash;
    }

    await storageManager.setItems({
      [SETTINGS_ADVANCED_KEY]: settings.advanced,
      [SETTINGS_APPEARANCE_KEY]: settings.appearance,
      [SETTINGS_GENERAL_KEY]: settings.general,
    });

    return settings;
  }
);

export default setSettings;