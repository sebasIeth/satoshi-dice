import { useState } from 'react';
import { useAccount, useReadContract, useSignTypedData } from 'wagmi';
import { readContract } from '@wagmi/core';
import { parseUnits } from 'viem';
import { USDC_ADDRESS, USDC_ABI, DICE_GAME_ADDRESS } from '../abis';
import { activeChain, config } from '../config';
import { relayRoll } from '../api';

const PERMIT_TYPES = {
  Permit: [
    { name: 'owner', type: 'address' },
    { name: 'spender', type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' },
  ],
} as const;

export function useGaslessRoll() {
  const { address } = useAccount();
  const { signTypedDataAsync } = useSignTypedData();

  const [isRelaying, setIsRelaying] = useState(false);
  const [relayTxHash, setRelayTxHash] = useState<`0x${string}` | undefined>();
  const [relayError, setRelayError] = useState<Error | null>(null);

  // Read USDC name for EIP-712 domain
  const { data: usdcName } = useReadContract({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: 'name',
    chainId: activeChain.id,
  });

  const gaslessRoll = async (target: number, isUnder: boolean, betAmount: number) => {
    if (!address) throw new Error('Wallet not connected');
    if (!usdcName) throw new Error('Contract data not loaded');

    setIsRelaying(true);
    setRelayTxHash(undefined);
    setRelayError(null);

    try {
      const amount = parseUnits(betAmount.toString(), 6);
      const deadline = Math.floor(Date.now() / 1000) + 600; // 10 minutes

      // Read fresh nonce directly from chain to avoid stale cache (with retries)
      let freshNonce: bigint | undefined;
      for (let attempt = 0; attempt < 4; attempt++) {
        try {
          freshNonce = await readContract(config, {
            address: USDC_ADDRESS,
            abi: USDC_ABI,
            functionName: 'nonces',
            args: [address],
            chainId: activeChain.id,
          });
          break;
        } catch {
          if (attempt === 3) throw new Error('Failed to read nonce from chain');
          await new Promise(r => setTimeout(r, 400 * 2 ** attempt));
        }
      }

      if (freshNonce === undefined) throw new Error('Failed to read nonce from chain');

      // Sign EIP-712 Permit
      const signature = await signTypedDataAsync({
        domain: {
          name: usdcName,
          version: '2',
          chainId: activeChain.id,
          verifyingContract: USDC_ADDRESS,
        },
        types: PERMIT_TYPES,
        primaryType: 'Permit',
        message: {
          owner: address,
          spender: DICE_GAME_ADDRESS,
          value: amount,
          nonce: freshNonce,
          deadline: BigInt(deadline),
        },
      });

      // Split signature into v, r, s
      const r = `0x${signature.slice(2, 66)}` as `0x${string}`;
      const s = `0x${signature.slice(66, 130)}` as `0x${string}`;
      const vHex = signature.slice(130, 132);
      const v = parseInt(vHex, 16);

      // Send to relayer
      const { txHash } = await relayRoll({
        player: address,
        target,
        isUnder,
        amount: amount.toString(),
        deadline,
        v,
        r,
        s,
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
