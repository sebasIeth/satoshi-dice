import { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import GameDial from './components/GameDial';
import BetControls from './components/BetControls';
import ActionButtons from './components/ActionButtons';
import History, { type HistoryItem } from './components/History';
import ProvablyFair from './components/ProvablyFair';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits, maxUint256, decodeEventLog } from 'viem';
import { DICE_GAME_ABI, DICE_GAME_ADDRESS, USDC_ABI, USDC_ADDRESS } from './abis';

function App() {
  const { address, isConnected } = useAccount();

  // Read USDC Balance
  const { data: usdcBalance } = useReadContract({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: 'balanceOf',
    args: [address!],
    query: { enabled: !!address, refetchInterval: 2000 }
  });

  // Read Allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: 'allowance',
    args: [address!, DICE_GAME_ADDRESS],
    query: { enabled: !!address, refetchInterval: 2000 }
  });

  const balance = usdcBalance ? parseFloat(formatUnits(usdcBalance, 6)) : 0;
  const currentAllowance = allowance ? parseFloat(formatUnits(allowance, 6)) : 0;



  // Read Bankroll (Contract Balance)
  const { data: bankroll } = useReadContract({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: 'balanceOf',
    args: [DICE_GAME_ADDRESS],
    query: { refetchInterval: 5000 }
  });
  const bankrollAmount = bankroll ? parseFloat(formatUnits(bankroll, 6)) : 0;

  const [betAmount, setBetAmount] = useState<number>(0.5);
  const [targetValue, setTargetValue] = useState<number>(50);
  const [result, setResult] = useState<number | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [lastRollResult, setLastRollResult] = useState<{
    txHash: string;
    blockNumber?: number;
    player: string;
    roll: number;
  } | null>(null);

  const targetValueRef = useRef(targetValue);
  useEffect(() => {
    targetValueRef.current = targetValue;
  }, [targetValue]);

  // Contract Writes
  // Split into separate hooks to avoid state conflicts
  const { data: approveHash, writeContract: writeApprove, isPending: isApprovePending, error: approveError } = useWriteContract();
  const { data: rollHash, writeContract: writeRoll, isPending: isRollPending, error: rollError } = useWriteContract();

  const { isLoading: isApproveConfirming, isSuccess: isApproveConfirmed } = useWaitForTransactionReceipt({
    hash: approveHash,
  });

  const { isLoading: isRollConfirming, isSuccess: isRollConfirmed, data: rollReceipt } = useWaitForTransactionReceipt({
    hash: rollHash,
  });

  // Handle Roll Confirmation & Log Parsing manually for immediate feedback
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

            console.log("Transaction Confirmed & Parsed:", { roll, isWin, payout });

            setResult(Number(roll));

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

            refetchAllowance();
          }
        } catch (e) {
          // Ignore other events
        }
      }
    }
  }, [isRollConfirmed, rollReceipt, refetchAllowance]);

  // Refetch allowance after approval confirms
  useEffect(() => {
    if (isApproveConfirmed) {
      refetchAllowance();
    }
  }, [isApproveConfirmed, refetchAllowance]);

  // Watcher removed to prevent duplicate history entries (Receipt Parser handles it)
  /* 
  useWatchContractEvent({
    address: DICE_GAME_ADDRESS,
    abi: DICE_GAME_ABI,
    eventName: 'BetPlaced',
    onLogs(logs) {
        // ... logic removed to avoid race condition with waitForTransactionReceipt
    }
  }); 
  */

  const isRolling = isRollPending || isRollConfirming;
  const isApproving = isApprovePending || isApproveConfirming;
  const needsApproval = currentAllowance < betAmount;

  const handleApprove = () => {
    writeApprove({
      address: USDC_ADDRESS,
      abi: USDC_ABI,
      functionName: 'approve',
      args: [DICE_GAME_ADDRESS, maxUint256]
    });
  };

  const handleRoll = (direction: 'under' | 'over') => {
    if (!isConnected) {
      alert("Please connect your wallet first");
      return;
    }
    if (balance < betAmount) {
      alert("Insufficient balance!");
      return;
    }

    setResult(null);

    // Contract: roll(uint8 target, bool isUnder, uint256 amount)
    const isUnder = direction === 'under';

    try {
      writeRoll({
        address: DICE_GAME_ADDRESS,
        abi: DICE_GAME_ABI,
        functionName: 'roll',
        args: [targetValue, isUnder, parseUnits(betAmount.toString(), 6)],
      });
    } catch (e) {
      console.error("Bet failed:", e);
    }
  };

  // Calculate Payouts
  // Calculate Payouts
  const winChanceUnder = Math.max(1, targetValue);
  const payoutUnderVal = (betAmount * (99 / winChanceUnder));
  const payoutUnder = payoutUnderVal.toFixed(2);

  const winChanceOver = Math.max(1, 99 - targetValue);
  const payoutOverVal = (betAmount * (99 / winChanceOver));
  const payoutOver = payoutOverVal.toFixed(2);

  const sufficientLiquidity = bankrollAmount >= Math.max(payoutUnderVal, payoutOverVal);

  return (
    <div className="min-h-screen bg-background text-white font-sans selection:bg-primary/30 flex flex-col items-center">
      {/* Main Mobile Container */}
      <div className="w-full max-w-[480px] min-h-screen bg-background relative shadow-2xl flex flex-col">
        <Header />

        <main className="flex-1 flex flex-col items-center justify-start py-6 gap-6 w-full">

          {/* Error Message */}
          {(approveError || rollError) && (
            <div className="w-full px-4">
              <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-2 rounded text-xs text-center">
                {approveError?.message?.split('.')[0] || rollError?.message?.split('.')[0]}
              </div>
            </div>
          )}

          {/* Liquidity Warning */}
          {!sufficientLiquidity && (
            <div className="w-full px-4">
              <div className="bg-yellow-500/10 border border-yellow-500/50 text-yellow-500 p-2 rounded text-xs text-center font-bold">
                ⚠️ Contract Low Funds. House cannot pay out. <br /> Please fund: {DICE_GAME_ADDRESS.slice(0, 6)}...{DICE_GAME_ADDRESS.slice(-4)}
              </div>
            </div>
          )}

          <GameDial
            value={targetValue}
            onChange={setTargetValue}
            result={result}
            isRolling={isRolling}
          />

          <BetControls
            betAmount={betAmount}
            setBetAmount={setBetAmount}
            targetValue={targetValue}
          />

          {needsApproval ? (
            <div className="w-full px-4 mt-2">
              <button
                onClick={handleApprove}
                disabled={isApproving}
                className="w-full py-4 bg-primary text-background font-bold rounded-xl shadow-[0_0_20px_rgba(247,147,26,0.2)] hover:shadow-[0_0_30px_rgba(247,147,26,0.4)] transition-all uppercase tracking-widest"
              >
                {isApproving ? 'Approving...' : 'Approve USDC'}
              </button>
            </div>
          ) : (
            <ActionButtons
              onRollUnder={() => handleRoll('under')}
              onRollOver={() => handleRoll('over')}
              targetValue={targetValue}
              disabled={isRolling || !sufficientLiquidity}
              payoutUnder={payoutUnder}
              payoutOver={payoutOver}
            />
          )}

          <History history={history} />

          <div className="mt-auto w-full">
            <ProvablyFair lastResult={lastRollResult} />
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
