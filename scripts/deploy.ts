import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import solc from 'solc';

const PRIVATE_KEY = ""
if (!PRIVATE_KEY) {
  console.error('Set DEPLOYER_PRIVATE_KEY or RELAYER_PRIVATE_KEY env var');
  process.exit(1);
}

const RPC_URL = process.env.RPC_URL || 'https://sepolia.base.org';
const USDC_ADDRESS = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';

const account = privateKeyToAccount(PRIVATE_KEY as `0x${string}`);

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(RPC_URL),
});

const walletClient = createWalletClient({
  account,
  chain: baseSepolia,
  transport: http(RPC_URL),
});

async function main() {
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
  console.log(`\nUpdate these files with the new address:`);
  console.log(`  - src/abis.ts  → DICE_GAME_ADDRESS`);
  console.log(`  - server/.env  → DICE_GAME_ADDRESS`);
}

main().catch(console.error);
