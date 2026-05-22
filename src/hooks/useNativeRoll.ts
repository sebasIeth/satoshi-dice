import { useState } from 'react';
import { useWriteContract } from 'wagmi';
import { parseEther } from 'viem';
import { DICE_GAME_NATIVE_ABI } from '../abis';
import type { ChainConfig } from '../chains';

export function useNativeRoll() {
  const { writeContractAsync } = useWriteContract();

  const [isRolling, setIsRolling] = useState(false);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const [error, setError] = useState<Error | null>(null);

  const nativeRoll = async (target: number, isUnder: boolean, chainConfig: ChainConfig) => {
    setIsRolling(true);
    setTxHash(undefined);
    setError(null);

    try {
      const totalValue = chainConfig.betAmount + chainConfig.fee;
      const value = parseEther(totalValue.toFixed(18));

      const hash = await writeContractAsync({
        address: chainConfig.diceGameAddress,
        abi: DICE_GAME_NATIVE_ABI,
        functionName: 'roll',
        args: [target, isUnder],
        value,
        chainId: chainConfig.chain.id,
      });

      setTxHash(hash);
    } catch (err: any) {
      setError(err);
    } finally {
      setIsRolling(false);
    }
  };

  return { nativeRoll, isRolling, txHash, error };
}
