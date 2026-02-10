import { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import GameDial from './components/GameDial';
import BetControls from './components/BetControls';
import ActionButtons from './components/ActionButtons';
import History, { type HistoryItem } from './components/History';
import GlobalHistory from './components/GlobalHistory';
import ProvablyFair from './components/ProvablyFair';
import Toast, { showToast } from './components/Toast';
import { useAccount, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatUnits, decodeEventLog } from 'viem';
import { DICE_GAME_ABI, DICE_GAME_ADDRESS, USDC_ABI, USDC_ADDRESS } from './abis';
import { activeChain } from './config';
import { saveBet } from './api';
import { useGaslessRoll } from './hooks/useGaslessRoll';

function App() {
  const { address, isConnected } = useAccount();

  // Read USDC Balance
  const { data: usdcBalance } = useReadContract({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: 'balanceOf',
    args: [address!],
    chainId: activeChain.id,
    query: { enabled: !!address, refetchInterval: 2000 }
  });

  const balance = usdcBalance ? parseFloat(formatUnits(usdcBalance, 6)) : 0;

  // Read Bankroll (Contract Balance)
  const { data: bankroll } = useReadContract({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: 'balanceOf',
    args: [DICE_GAME_ADDRESS],
    chainId: activeChain.id,
    query: { refetchInterval: 5000 }
  });
  const bankrollAmount = bankroll ? parseFloat(formatUnits(bankroll, 6)) : 0;

  const betAmount = 0.10;
  const [targetValue, setTargetValue] = useState<number>(50);
  const [result, setResult] = useState<number | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [lastRollResult, setLastRollResult] = useState<{
    txHash: string;
    blockNumber?: number;
    player: string;
    roll: number;
  } | null>(null);
  const [lastBetIsWin, setLastBetIsWin] = useState<boolean | null>(null);

  const targetValueRef = useRef(targetValue);
  useEffect(() => {
    targetValueRef.current = targetValue;
  }, [targetValue]);

  const directionRef = useRef<'under' | 'over'>('under');
  const [betCount, setBetCount] = useState(0);

  // Gasless roll hook
  const { gaslessRoll, isRelaying, relayTxHash, relayError } = useGaslessRoll();

  // Wait for relay transaction confirmation
  const { isLoading: isRollConfirming, isSuccess: isRollConfirmed, data: rollReceipt } = useWaitForTransactionReceipt({
    hash: relayTxHash,
  });

  // Handle Roll Confirmation & Log Parsing
  useEffect(() => {
    if (isRollConfirmed && rollReceipt) {
      for (const log of rollReceipt.logs) {
        try {
          const decoded = decodeEventLog({
            abi: DICE_GAME_ABI,
            data: log.data,
            topics: log.topics,
          });

          if (decoded.eventName === 'BetPlaced') {
            const { roll, isWin, payout: payoutRaw, amount: amountRaw } = decoded.args;
            const payout = payoutRaw ? parseFloat(formatUnits(payoutRaw, 6)) : 0;
            const amount = amountRaw ? parseFloat(formatUnits(amountRaw, 6)) : 0;
            const currentTarget = targetValueRef.current;

            setResult(Number(roll));
            setLastBetIsWin(isWin || false);

            setLastRollResult({
              txHash: rollReceipt.transactionHash,
              blockNumber: Number(rollReceipt.blockNumber),
              player: address!,
              roll: Number(roll)
            });

            const newItem: HistoryItem = {
              id: Date.now(),
              result: Number(roll),
              target: currentTarget,
              isWin: isWin || false,
              amount: isWin ? payout : amount
            };
            setHistory(prev => [newItem, ...prev]);

            // Show toast notification
            if (isWin) {
              showToast('success', `You won $${payout.toFixed(2)} USDC! Rolled ${roll}`);
            } else {
              showToast('error', `You lost $${amount.toFixed(2)} USDC. Rolled ${roll}`);
            }

            // Persist to MongoDB (fire-and-forget)
            saveBet({
              player: address!,
              amount,
              result: Number(roll),
              target: currentTarget,
              direction: directionRef.current,
              isWin: isWin || false,
              payout,
              txHash: rollReceipt.transactionHash,
            }).then(() => setBetCount(c => c + 1));
          }
        } catch {
          // Ignore other events
        }
      }
    }
  }, [isRollConfirmed, rollReceipt]);

  // Show relay errors as toast
  useEffect(() => {
    if (relayError) {
      showToast('error', relayError.message?.split('.')[0] || 'Transaction failed');
    }
  }, [relayError]);

  const isRolling = isRelaying || isRollConfirming;

  const handleRoll = (direction: 'under' | 'over') => {
    if (!isConnected) {
      showToast('warning', 'Please connect your wallet first');
      return;
    }
    if (balance < betAmount) {
      showToast('warning', 'Insufficient USDC balance');
      return;
    }

    setResult(null);
    setLastBetIsWin(null);
    directionRef.current = direction;

    const isUnder = direction === 'under';
    gaslessRoll(targetValue, isUnder, betAmount);
  };

  // Calculate Payouts
  const winChanceUnder = Math.max(1, targetValue);
  const payoutUnderVal = (betAmount * (99 / winChanceUnder));
  const payoutUnder = payoutUnderVal.toFixed(2);

  const winChanceOver = Math.max(1, 99 - targetValue);
  const payoutOverVal = (betAmount * (99 / winChanceOver));
  const payoutOver = payoutOverVal.toFixed(2);

  const canPayUnder = bankrollAmount >= payoutUnderVal;
  const canPayOver = bankrollAmount >= payoutOverVal;

  return (
    <div className="min-h-screen min-h-[100dvh] bg-background text-white font-sans selection:bg-primary/30 flex flex-col items-center">
      {/* Main Mobile Container */}
      <div className="w-full max-w-[480px] min-h-screen min-h-[100dvh] bg-background relative shadow-2xl flex flex-col">
        <Header />

        <main className="flex-1 flex flex-col items-center justify-start py-2 gap-2 w-full">

          {/* Liquidity Warning */}
          {(!canPayUnder || !canPayOver) && (
            <div className="w-full px-4">
              <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 p-3 rounded-xl text-xs text-center font-mono">
                Contract Low Funds. House cannot pay out.
                <br />
                <span className="text-yellow-500/60 text-[10px]">Fund: {DICE_GAME_ADDRESS.slice(0, 6)}...{DICE_GAME_ADDRESS.slice(-4)}</span>
              </div>
            </div>
          )}

          <GameDial
            value={targetValue}
            onChange={(v) => { setTargetValue(v); setResult(null); setLastBetIsWin(null); }}
            result={result}
            isRolling={isRolling}
            isWin={lastBetIsWin}
          />

          <BetControls
            betAmount={betAmount}
            targetValue={targetValue}
            isRolling={isRolling}
            isWin={lastBetIsWin}
          />

          <ActionButtons
            onRollUnder={() => handleRoll('under')}
            onRollOver={() => handleRoll('over')}
            targetValue={targetValue}
            disabledUnder={isRolling || !canPayUnder}
            disabledOver={isRolling || !canPayOver}
            isRolling={isRolling}
            payoutUnder={payoutUnder}
            payoutOver={payoutOver}
          />

          <History history={history} />

          <GlobalHistory refreshKey={betCount} />

          <div className="mt-auto w-full">
            <ProvablyFair lastResult={lastRollResult} />
          </div>
        </main>
      </div>

      {/* Toast notifications */}
      <Toast />
    </div>
  );
}

export default App;
