// Types
import { INetwork } from '../types';
import { NetworkTypeEnum } from '../enums';

/**
 * Convenience function that simply gets the default network, either the first stable network, or the first network in
 * the list.
 * @param {INetwork[]} networks - a list of networks to select the default network from.
 * @returns {INetwork} the default network.
 */
export default function selectDefaultNetwork(networks: INetwork[]): INetwork {
  return (
    networks.find((value) => value.type === NetworkTypeEnum.Stable) ||
    networks[0]
  );
}
