import { type Chain } from 'viem';
import { base, polygon } from 'viem/chains';

// Rootstock mainnet chain definition
export const rootstock: Chain = {
  id: 30,
  name: 'Rootstock',
  nativeCurrency: { name: 'RBTC', symbol: 'RBTC', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://public-node.rsk.co'] },
  },
  blockExplorers: {
    default: { name: 'RSK Explorer', url: 'https://explorer.rootstock.io' },
  },
};

export type ChainKey = 'base' | 'polygon' | 'rootstock';

export interface ChainConfig {
  chain: Chain;
  key: ChainKey;
  token: string;
  decimals: number;
  isNative: boolean;
  diceGameAddress: `0x${string}`;
  tokenAddress?: `0x${string}`;
  betAmount: number;
  fee: number;
  explorerTxUrl: (hash: string) => string;
  rpcUrl: string;
}

const env = import.meta.env;

export const CHAIN_CONFIGS: Record<number, ChainConfig> = {
  [base.id]: {
    chain: base,
    key: 'base',
    token: 'USDC',
    decimals: 6,
    isNative: false,
    diceGameAddress: (env.VITE_DICE_GAME_ADDRESS_BASE || env.VITE_DICE_GAME_ADDRESS || '0x16c7fc23ac5c571e3e4765bc7e80e440f38be553') as `0x${string}`,
    tokenAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as `0x${string}`,
    betAmount: 0.10,
    fee: 0.01,
    explorerTxUrl: (h) => `https://basescan.org/tx/${h}`,
    rpcUrl: env.VITE_RPC_URL_BASE || env.VITE_RPC_URL || 'https://mainnet.base.org',
  },
  [polygon.id]: {
    chain: polygon,
    key: 'polygon',
    token: 'USDC',
    decimals: 6,
    isNative: false,
    diceGameAddress: (env.VITE_DICE_GAME_ADDRESS_POLYGON || '0xefe97121920805f8f3b3c35af6f5d33a295c6285') as `0x${string}`,
    tokenAddress: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359' as `0x${string}`,
    betAmount: 0.10,
    fee: 0.01,
    explorerTxUrl: (h) => `https://polygonscan.com/tx/${h}`,
    rpcUrl: env.VITE_RPC_URL_POLYGON || 'https://polygon-rpc.com',
  },
  [rootstock.id]: {
    chain: rootstock,
    key: 'rootstock',
    token: 'RBTC',
    decimals: 18,
    isNative: true,
    diceGameAddress: (env.VITE_DICE_GAME_ADDRESS_ROOTSTOCK || '0xefe97121920805f8f3b3c35af6f5d33a295c6285') as `0x${string}`,
    betAmount: 0.0000015,
    fee: 0.0000002,
    explorerTxUrl: (h) => `https://explorer.rootstock.io/tx/${h}`,
    rpcUrl: env.VITE_RPC_URL_ROOTSTOCK || 'https://public-node.rsk.co',
  },
};

export const SUPPORTED_CHAINS = [base, polygon, rootstock] as [Chain, ...Chain[]];
export const DEFAULT_CHAIN_ID = base.id;

export function getChainConfig(chainId: number): ChainConfig | undefined {
  return CHAIN_CONFIGS[chainId];
}
