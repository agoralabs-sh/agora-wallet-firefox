// Types
import { ISettingsState } from '../types';

export default function getInitialState(): ISettingsState {
  return {
    advanced: {
      allowBetaNet: false,
      allowTestNet: false,
    },
    fetching: false,
    network: null,
    saving: false,
  };
}
