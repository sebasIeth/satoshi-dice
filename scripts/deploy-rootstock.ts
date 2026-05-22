import { createPublicClient, createWalletClient, http, defineChain } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import solc from 'solc';

const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || process.env.RELAYER_PRIVATE_KEY;
if (!PRIVATE_KEY) {
  console.error('Set DEPLOYER_PRIVATE_KEY or RELAYER_PRIVATE_KEY env var');
  process.exit(1);
}

const rootstock = defineChain({
  id: 30,
  name: 'Rootstock',
  nativeCurrency: { name: 'RBTC', symbol: 'RBTC', decimals: 18 },
  rpcUrls: { default: { http: ['https://public-node.rsk.co'] } },
  blockExplorers: { default: { name: 'RSK Explorer', url: 'https://explorer.rootstock.io' } },
});

const RPC_URL = process.env.RPC_URL || 'https://public-node.rsk.co';
const OWNER_ADDRESS = process.env.OWNER_ADDRESS || '0x667557d9fd190f95Bd3c1aA7Af4f8825Acbc426D';
const INITIAL_FEE = process.env.INITIAL_FEE || '200000000000'; // 0.0000002 RBTC in wei

const account = privateKeyToAccount(PRIVATE_KEY as `0x${string}`);

const publicClient = createPublicClient({
  chain: rootstock,
  transport: http(RPC_URL),
});

const walletClient = createWalletClient({
  account,
  chain: rootstock,
  transport: http(RPC_URL),
});

async function main() {
  console.log('Compiling DiceGameNative.sol for Rootstock...');

  const contractPath = resolve(import.meta.dirname, '..', 'contracts', 'DiceGameNative.sol');
  const source = readFileSync(contractPath, 'utf-8');

  const inputJson = JSON.stringify({
    language: 'Solidity',
    sources: { 'DiceGameNative.sol': { content: source } },
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

  const contract = output.contracts['DiceGameNative.sol']['DiceGameNative'];
  const bytecode = `0x${contract.evm.bytecode.object}` as `0x${string}`;
  const abi = contract.abi;

  console.log('Compilation successful!');
  console.log(`Deploying from ${account.address} on Rootstock...`);
  console.log(`Owner: ${OWNER_ADDRESS}`);
  console.log(`Initial fee: ${INITIAL_FEE} wei (${Number(INITIAL_FEE) / 1e18} RBTC)`);

  const balance = await publicClient.getBalance({ address: account.address });
  console.log(`Deployer balance: ${Number(balance) / 1e18} RBTC`);

  if (balance === 0n) {
    console.error('\nNo RBTC balance! You need RBTC to deploy on Rootstock.');
    console.error('Get testnet RBTC at: https://faucet.rootstock.io/');
    process.exit(1);
  }

  const hash = await walletClient.deployContract({
    abi,
    bytecode,
    args: [OWNER_ADDRESS, BigInt(INITIAL_FEE)],
  });

  console.log(`Deploy tx: ${hash}`);

  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  console.log(`\nContract deployed at: ${receipt.contractAddress}`);
  console.log(`\nUpdate VITE_DICE_GAME_ADDRESS_ROOTSTOCK with this address.`);
  console.log(`\nTo fund the contract vault, send RBTC directly to: ${receipt.contractAddress}`);
}

main().catch(console.error);
