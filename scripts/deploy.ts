import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base, baseSepolia } from 'viem/chains';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import solc from 'solc';

// --- Config via env vars ---
const NETWORK = process.env.NETWORK || 'sepolia'; // "mainnet" | "sepolia"
const isMainnet = NETWORK === 'mainnet';

const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || process.env.RELAYER_PRIVATE_KEY;
if (!PRIVATE_KEY) {
  console.error('Set DEPLOYER_PRIVATE_KEY or RELAYER_PRIVATE_KEY env var');
  process.exit(1);
}

const activeChain = isMainnet ? base : baseSepolia;
const RPC_URL = process.env.RPC_URL || (isMainnet ? 'https://mainnet.base.org' : 'https://sepolia.base.org');
const USDC_ADDRESS = isMainnet
  ? '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'  // Base mainnet USDC
  : '0x036CbD53842c5426634e7929541eC2318f3dCF7e'; // Base Sepolia USDC

const account = privateKeyToAccount(PRIVATE_KEY as `0x${string}`);

const publicClient = createPublicClient({
  chain: activeChain,
  transport: http(RPC_URL),
});

const walletClient = createWalletClient({
  account,
  chain: activeChain,
  transport: http(RPC_URL),
});

async function main() {
  console.log(`\nDeploying to ${isMainnet ? 'Base Mainnet' : 'Base Sepolia'}...`);
  console.log(`Chain ID: ${activeChain.id}`);
  console.log(`RPC: ${RPC_URL}`);
  console.log(`USDC: ${USDC_ADDRESS}\n`);

  console.log('Compiling DiceGame.sol...');

  const contractPath = resolve(import.meta.dirname, '..', 'contracts', 'DiceGame.sol');
  const source = readFileSync(contractPath, 'utf-8');

  const inputJson = JSON.stringify({
    language: 'Solidity',
    sources: { 'DiceGame.sol': { content: source } },
    settings: {
      outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object'] } },
      viaIR: true,
      optimizer: { enabled: true, runs: 200 },
    },
  });

  const output = JSON.parse(solc.compile(inputJson));

  if (output.errors?.some((e: any) => e.severity === 'error')) {
    console.error('Compilation errors:', output.errors);
    process.exit(1);
  }

  const contract = output.contracts['DiceGame.sol']['DiceGame'];
  const bytecode = `0x${contract.evm.bytecode.object}` as `0x${string}`;
  const abi = contract.abi;

  console.log('Compilation successful!');
  console.log(`Deploying from ${account.address}...`);

  const hash = await walletClient.deployContract({
    abi,
    bytecode,
    args: [USDC_ADDRESS],
  });

  console.log(`Deploy tx: ${hash}`);

  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  console.log(`\nContract deployed at: ${receipt.contractAddress}`);
  console.log(`Network: ${isMainnet ? 'Base Mainnet' : 'Base Sepolia'}`);
  console.log(`\nUpdate these with the new address:`);
  console.log(`  - .env                → VITE_DICE_GAME_ADDRESS=${receipt.contractAddress}`);
  console.log(`  - .env.production     → VITE_DICE_GAME_ADDRESS=${receipt.contractAddress}`);
  console.log(`  - server/.env         → DICE_GAME_ADDRESS=${receipt.contractAddress}`);
}

main().catch(console.error);
