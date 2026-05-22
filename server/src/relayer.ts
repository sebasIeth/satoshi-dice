import { createPublicClient, createWalletClient, http, parseAbi, type Chain } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base, polygon } from 'viem/chains';

const RELAYER_PRIVATE_KEY = process.env.RELAYER_PRIVATE_KEY as `0x${string}`;
if (!RELAYER_PRIVATE_KEY) {
  throw new Error('RELAYER_PRIVATE_KEY is required');
}

export const relayerAccount = privateKeyToAccount(RELAYER_PRIVATE_KEY);

export const USDC_ABI = parseAbi([
  'function balanceOf(address account) external view returns (uint256)',
]);

export const DICE_GAME_ABI = parseAbi([
  'function rollWithPermit(address player, uint8 target, bool isUnder, uint256 amount, uint256 deadline, uint8 v, bytes32 r, bytes32 s) external',
  'function fee() external view returns (uint256)',
]);

// Chain-specific config
interface ChainRelayConfig {
  chain: Chain;
  diceGameAddress: `0x${string}`;
  usdcAddress: `0x${string}`;
  rpcUrl: string;
  publicClient: ReturnType<typeof createPublicClient>;
  walletClient: ReturnType<typeof createWalletClient>;
}

function createChainConfig(
  chain: Chain,
  diceGameAddress: string | undefined,
  usdcAddress: string,
  rpcUrl: string,
): ChainRelayConfig | null {
  if (!diceGameAddress) return null;

  const transport = http(rpcUrl, { retryCount: 3, retryDelay: 200, timeout: 20_000 });

  return {
    chain,
    diceGameAddress: diceGameAddress as `0x${string}`,
    usdcAddress: usdcAddress as `0x${string}`,
    rpcUrl,
    publicClient: createPublicClient({ chain, transport }),
    walletClient: createWalletClient({ account: relayerAccount, chain, transport }),
  };
}

// Build chain configs from env
const chainConfigs: Record<string, ChainRelayConfig> = {};

// Base
const baseConfig = createChainConfig(
  base,
  process.env.DICE_GAME_ADDRESS_BASE || process.env.DICE_GAME_ADDRESS,
  process.env.USDC_ADDRESS_BASE || process.env.USDC_ADDRESS || '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  process.env.RPC_URL_BASE || process.env.RPC_URL || 'https://mainnet.base.org',
);
if (baseConfig) chainConfigs['base'] = baseConfig;

// Polygon
const polygonConfig = createChainConfig(
  polygon,
  process.env.DICE_GAME_ADDRESS_POLYGON,
  process.env.USDC_ADDRESS_POLYGON || '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
  process.env.RPC_URL_POLYGON || 'https://polygon-rpc.com',
);
if (polygonConfig) chainConfigs['polygon'] = polygonConfig;

export function getChainRelayConfig(chain: string): ChainRelayConfig | undefined {
  return chainConfigs[chain];
}

export function getAvailableChains(): string[] {
  return Object.keys(chainConfigs);
}

// Legacy exports for backwards compatibility (defaults to base)
export const DICE_GAME_ADDRESS = baseConfig?.diceGameAddress || ('' as `0x${string}`);
export const USDC_ADDRESS = baseConfig?.usdcAddress || ('' as `0x${string}`);
export const publicClient = baseConfig?.publicClient;
export const walletClient = baseConfig?.walletClient;
