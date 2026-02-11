import { createPublicClient, createWalletClient, http, parseAbi } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base, baseSepolia } from 'viem/chains';

const RELAYER_PRIVATE_KEY = process.env.RELAYER_PRIVATE_KEY as `0x${string}`;
if (!RELAYER_PRIVATE_KEY) {
  throw new Error('RELAYER_PRIVATE_KEY is required');
}

const isMainnet = process.env.NETWORK === 'mainnet';
const activeChain = isMainnet ? base : baseSepolia;

export const DICE_GAME_ADDRESS = process.env.DICE_GAME_ADDRESS as `0x${string}`;
export const USDC_ADDRESS = (process.env.USDC_ADDRESS || (isMainnet
  ? '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
  : '0x036CbD53842c5426634e7929541eC2318f3dCF7e'
)) as `0x${string}`;
const RPC_URL = process.env.RPC_URL || (isMainnet ? 'https://mainnet.base.org' : 'https://sepolia.base.org');

export const relayerAccount = privateKeyToAccount(RELAYER_PRIVATE_KEY);

export const publicClient = createPublicClient({
  chain: activeChain,
  transport: http(RPC_URL, {
    retryCount: 3,
    retryDelay: 200,
    timeout: 20_000,
  }),
});

export const walletClient = createWalletClient({
  account: relayerAccount,
  chain: activeChain,
  transport: http(RPC_URL, {
    retryCount: 3,
    retryDelay: 200,
    timeout: 20_000,
  }),
});

export const USDC_ABI = parseAbi([
  'function balanceOf(address account) external view returns (uint256)',
]);

export const DICE_GAME_ABI = parseAbi([
  'function rollWithPermit(address player, uint8 target, bool isUnder, uint256 amount, uint256 deadline, uint8 v, bytes32 r, bytes32 s) external',
  'function fee() external view returns (uint256)',
]);
