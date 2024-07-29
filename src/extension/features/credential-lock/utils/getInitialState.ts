// types
import type { IState } from '../types';

export default function getInitialState(): IState {
  return {
    activated: null,
    saving: false,
  };
}
