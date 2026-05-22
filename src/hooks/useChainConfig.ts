import { useChainId } from 'wagmi';
import { getChainConfig, CHAIN_CONFIGS, DEFAULT_CHAIN_ID, type ChainConfig } from '../chains';

export function useChainConfig(): ChainConfig {
  const chainId = useChainId();
  return getChainConfig(chainId) || CHAIN_CONFIGS[DEFAULT_CHAIN_ID]!;
}
