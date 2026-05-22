import { useState } from 'react';
import { useAccount, useReadContract, useSignTypedData } from 'wagmi';
import { readContract } from '@wagmi/core';
import { parseUnits } from 'viem';
import { USDC_ABI, DICE_GAME_ABI } from '../abis';
import { config } from '../config';
import { relayRoll } from '../api';
import type { ChainConfig } from '../chains';

const PERMIT_TYPES = {
  Permit: [
    { name: 'owner', type: 'address' },
    { name: 'spender', type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' },
  ],
} as const;

export function useGaslessRoll(chainConfig: ChainConfig) {
  const { address } = useAccount();
  const { signTypedDataAsync } = useSignTypedData();

  const [isRelaying, setIsRelaying] = useState(false);
  const [relayTxHash, setRelayTxHash] = useState<`0x${string}` | undefined>();
  const [relayError, setRelayError] = useState<Error | null>(null);

  const tokenAddress = chainConfig.tokenAddress!;
  const diceGameAddress = chainConfig.diceGameAddress;
  const chainId = chainConfig.chain.id;

  // Read USDC name for EIP-712 domain
  const { data: usdcName } = useReadContract({
    address: tokenAddress,
    abi: USDC_ABI,
    functionName: 'name',
    chainId,
    query: { enabled: !chainConfig.isNative },
  });

  // Read fee from contract
  const { data: contractFee } = useReadContract({
    address: diceGameAddress,
    abi: DICE_GAME_ABI,
    functionName: 'fee',
    chainId,
    query: { enabled: !chainConfig.isNative },
  });

  const gaslessRoll = async (target: number, isUnder: boolean, betAmount: number) => {
    if (!address) throw new Error('Wallet not connected');
    if (!usdcName) throw new Error('Contract data not loaded');

    setIsRelaying(true);
    setRelayTxHash(undefined);
    setRelayError(null);

    try {
      const amount = parseUnits(betAmount.toString(), chainConfig.decimals);
      const fallbackFee = parseUnits(chainConfig.fee.toString(), chainConfig.decimals);
      const fee = contractFee ?? fallbackFee;
      const permitValue = amount + fee;
      const deadline = Math.floor(Date.now() / 1000) + 600;

      // Read fresh nonce
      let freshNonce: bigint | undefined;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          freshNonce = await readContract(config, {
            address: tokenAddress,
            abi: USDC_ABI,
            functionName: 'nonces',
            args: [address],
            chainId,
          });
          break;
        } catch {
          if (attempt === 2) throw new Error('Failed to read nonce from chain');
          await new Promise(r => setTimeout(r, 300 * 2 ** attempt));
        }
      }

      if (freshNonce === undefined) throw new Error('Failed to read nonce from chain');

      // Sign EIP-712 Permit
      const signature = await signTypedDataAsync({
        domain: {
          name: usdcName,
          version: '2',
          chainId,
          verifyingContract: tokenAddress,
        },
        types: PERMIT_TYPES,
        primaryType: 'Permit',
        message: {
          owner: address,
          spender: diceGameAddress,
          value: permitValue,
          nonce: freshNonce,
          deadline: BigInt(deadline),
        },
      });

      const r = `0x${signature.slice(2, 66)}` as `0x${string}`;
      const s = `0x${signature.slice(66, 130)}` as `0x${string}`;
      const vHex = signature.slice(130, 132);
      const v = parseInt(vHex, 16);

      const { txHash } = await relayRoll({
        player: address,
        target,
        isUnder,
        amount: amount.toString(),
        deadline,
        v,
        r,
        s,
        chain: chainConfig.key,
      });

      setRelayTxHash(txHash as `0x${string}`);
    } catch (err: any) {
      setRelayError(err);
    } finally {
      setIsRelaying(false);
    }
  };

  return { gaslessRoll, isRelaying, relayTxHash, relayError };
}
