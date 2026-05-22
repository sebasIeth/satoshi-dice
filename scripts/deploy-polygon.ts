import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { polygon } from 'viem/chains';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import solc from 'solc';

const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || process.env.RELAYER_PRIVATE_KEY;
if (!PRIVATE_KEY) {
  console.error('Set DEPLOYER_PRIVATE_KEY or RELAYER_PRIVATE_KEY env var');
  process.exit(1);
}

const RPC_URL = process.env.RPC_URL || 'https://polygon-bor-rpc.publicnode.com';
const USDC_ADDRESS = '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359'; // Polygon native USDC
const OWNER_ADDRESS = process.env.OWNER_ADDRESS || '0x667557d9fd190f95Bd3c1aA7Af4f8825Acbc426D';

const account = privateKeyToAccount(PRIVATE_KEY as `0x${string}`);

const publicClient = createPublicClient({
  chain: polygon,
  transport: http(RPC_URL),
});

const walletClient = createWalletClient({
  account,
  chain: polygon,
  transport: http(RPC_URL),
});

async function main() {
  console.log('Compiling DiceGame.sol for Polygon...');

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
  console.log(`Deploying from ${account.address} on Polygon...`);
  console.log(`USDC: ${USDC_ADDRESS}`);
  console.log(`Owner: ${OWNER_ADDRESS}`);

  const hash = await walletClient.deployContract({
    abi,
    bytecode,
    args: [USDC_ADDRESS, OWNER_ADDRESS],
  });

  console.log(`Deploy tx: ${hash}`);

  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  console.log(`\nContract deployed at: ${receipt.contractAddress}`);
  console.log(`\nUpdate VITE_DICE_GAME_ADDRESS_POLYGON with this address.`);
  console.log(`Also update server env: DICE_GAME_ADDRESS_POLYGON=${receipt.contractAddress}`);
}

main().catch(console.error);
