import { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import GameDial from './components/GameDial';
import BetControls from './components/BetControls';
import ActionButtons from './components/ActionButtons';
import History, { type HistoryItem } from './components/History';
import GlobalHistory from './components/GlobalHistory';
import ProvablyFair from './components/ProvablyFair';
import Toast, { showToast } from './components/Toast';
import ChainSelector from './components/ChainSelector';
import { useAccount, useReadContract, useWaitForTransactionReceipt, useBalance, useSwitchChain, useChainId } from 'wagmi';
import { formatUnits, decodeEventLog } from 'viem';
import { DICE_GAME_ABI, DICE_GAME_NATIVE_ABI, USDC_ABI } from './abis';
import { CHAIN_CONFIGS, DEFAULT_CHAIN_ID, type ChainConfig } from './chains';
import { saveBet } from './api';
import { useGaslessRoll } from './hooks/useGaslessRoll';
import { useNativeRoll } from './hooks/useNativeRoll';
import { getXOAlias } from './connectors/xo-connector';
import { Wallet } from 'lucide-react';

function App() {
  const { address, isConnected, connector } = useAccount();
  const walletChainId = useChainId();
  const { switchChainAsync } = useSwitchChain();

  // Chain selection state
  const [selectedChainId, setSelectedChainId] = useState<number>(DEFAULT_CHAIN_ID);
  const [isSwitchingChain, setIsSwitchingChain] = useState(false);

  // Sync wallet chain → UI when wallet switches
  useEffect(() => {
    if (walletChainId && CHAIN_CONFIGS[walletChainId]) {
      setSelectedChainId(walletChainId);
    }
  }, [walletChainId]);

  const chainConfig: ChainConfig = CHAIN_CONFIGS[selectedChainId] || CHAIN_CONFIGS[DEFAULT_CHAIN_ID]!;

  const handleChainSelect = async (chainId: number) => {
    setSelectedChainId(chainId);
    if (isConnected) {
      setIsSwitchingChain(true);
      try {
        await switchChainAsync({ chainId });
      } catch (err: any) {
        // If wallet doesn't support switching, just update UI state
        console.warn('Chain switch failed:', err.message);
      } finally {
        setIsSwitchingChain(false);
      }
    }
  };

  // Ensure wallet is on the correct chain before rolling
  const ensureCorrectChain = async (): Promise<boolean> => {
    if (walletChainId === selectedChainId) return true;
    try {
      await switchChainAsync({ chainId: selectedChainId });
      return true;
    } catch (err: any) {
      showToast('error', `Cambia tu wallet a ${chainConfig.chain.name} para jugar`);
      return false;
    }
  };

  // ---- Balances ----
  // ERC20 balance (Base, Polygon)
  const { data: erc20Balance } = useReadContract({
    address: chainConfig.tokenAddress!,
    abi: USDC_ABI,
    functionName: 'balanceOf',
    args: [address!],
    chainId: chainConfig.chain.id,
    query: { enabled: !!address && !chainConfig.isNative, refetchInterval: 3000 },
  });

  // Native balance (Rootstock)
  const { data: nativeUserBalance } = useBalance({
    address: address,
    chainId: chainConfig.chain.id,
    query: { enabled: !!address && chainConfig.isNative, refetchInterval: 3000 },
  });

  // ERC20 bankroll
  const { data: erc20Bankroll } = useReadContract({
    address: chainConfig.tokenAddress!,
    abi: USDC_ABI,
    functionName: 'balanceOf',
    args: [chainConfig.diceGameAddress],
    chainId: chainConfig.chain.id,
    query: { enabled: !chainConfig.isNative, refetchInterval: 6000 },
  });

  // Native bankroll
  const { data: nativeBankrollBalance } = useBalance({
    address: chainConfig.diceGameAddress,
    chainId: chainConfig.chain.id,
    query: { enabled: chainConfig.isNative, refetchInterval: 6000 },
  });

  // Unified balance
  const balance = chainConfig.isNative
    ? (nativeUserBalance ? parseFloat(nativeUserBalance.formatted) : 0)
    : (erc20Balance ? parseFloat(formatUnits(erc20Balance, chainConfig.decimals)) : 0);

  const bankrollAmount = chainConfig.isNative
    ? (nativeBankrollBalance ? parseFloat(nativeBankrollBalance.formatted) : 0)
    : (erc20Bankroll ? parseFloat(formatUnits(erc20Bankroll, chainConfig.decimals)) : 0);

  // Format balance display based on token type
  const userBalanceDisplay = chainConfig.isNative
    ? balance.toFixed(8)
    : (Math.trunc(balance * 100) / 100).toFixed(2);

  const isXO = connector?.id === 'xo-connect';
  const alias = isXO ? getXOAlias() : null;
  const displayName = alias || (address ? address.slice(0, 6) + '...' + address.slice(-4) : '');

  const betAmount = chainConfig.betAmount;
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

  // ---- Roll Hooks ----
  const { gaslessRoll, isRelaying, relayTxHash, relayError } = useGaslessRoll(chainConfig);
  const { nativeRoll, isRolling: isNativeRolling, txHash: nativeTxHash, error: nativeError } = useNativeRoll();

  // Unified tx hash and state
  const activeTxHash = chainConfig.isNative ? nativeTxHash : relayTxHash;
  const isSubmitting = chainConfig.isNative ? isNativeRolling : isRelaying;
  const rollError = chainConfig.isNative ? nativeError : relayError;

  // Wait for transaction confirmation
  const { isLoading: isRollConfirming, isSuccess: isRollConfirmed, data: rollReceipt } = useWaitForTransactionReceipt({
    hash: activeTxHash,
  });

  // Handle Roll Confirmation & Log Parsing
  useEffect(() => {
    if (isRollConfirmed && rollReceipt) {
      const abi = chainConfig.isNative ? DICE_GAME_NATIVE_ABI : DICE_GAME_ABI;
      for (const log of rollReceipt.logs) {
        let decoded;
        try {
          decoded = decodeEventLog({
            abi,
            data: log.data,
            topics: log.topics,
          });
        } catch {
          continue;
        }

        if (decoded.eventName === 'BetPlaced') {
          const { roll, isWin, payout: payoutRaw, amount: amountRaw } = decoded.args;
          const payout = payoutRaw ? parseFloat(formatUnits(payoutRaw, chainConfig.decimals)) : 0;
          const amount = amountRaw ? parseFloat(formatUnits(amountRaw, chainConfig.decimals)) : 0;
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

          const tokenLabel = chainConfig.token;
          if (isWin) {
            showToast('success', `You won ${payout.toFixed(chainConfig.isNative ? 8 : 2)} ${tokenLabel}! Rolled ${roll}`);
          } else {
            showToast('error', `You lost ${amount.toFixed(chainConfig.isNative ? 8 : 2)} ${tokenLabel}. Rolled ${roll}`);
          }

          const persistBet = async () => {
            const payload = {
              player: address!,
              amount,
              result: Number(roll),
              target: currentTarget,
              direction: directionRef.current,
              isWin: isWin || false,
              payout,
              txHash: rollReceipt.transactionHash,
              chain: chainConfig.key,
            };
            for (let attempt = 0; attempt < 3; attempt++) {
              try {
                await saveBet(payload);
                return;
              } catch (err) {
                console.error(`saveBet attempt ${attempt + 1} failed:`, err);
                if (attempt < 2) await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
              }
            }
            showToast('warning', 'Jugada no guardada en el historial');
          };
          persistBet().finally(() => setBetCount(c => c + 1));
        }
      }
    }
  }, [isRollConfirmed, rollReceipt]);

  // Show roll errors as toast
  const [, setLastRelayError] = useState<string | null>(null);
  useEffect(() => {
    if (rollError) {
      const raw = rollError.message || '';
      setLastRelayError(raw);
      let friendly: string;
      if (/gas required exceeds allowance/i.test(raw) || /execution reverted/i.test(raw)) {
        friendly = 'En este momento no podemos ejecutar, espera un momento';
      } else if (/insufficient/i.test(raw) && /balance/i.test(raw)) {
        friendly = `Saldo ${chainConfig.token} insuficiente`;
      } else if (/nonce/i.test(raw)) {
        friendly = 'Error de sincronización, intenta de nuevo';
      } else if (/user rejected/i.test(raw) || /user denied/i.test(raw)) {
        friendly = 'Transacción cancelada por el usuario';
      } else {
        friendly = raw.split('.')[0] || 'Error en la transacción, intenta de nuevo';
      }
      showToast('error', friendly);
    }
  }, [rollError]);

  const isRolling = isSwitchingChain || isSubmitting || isRollConfirming;

  const handleRoll = async (direction: 'under' | 'over') => {
    if (!isConnected) {
      showToast('warning', 'Please connect your wallet first');
      return;
    }

    const totalNeeded = betAmount + chainConfig.fee;
    if (balance < totalNeeded) {
      showToast('warning', `Insufficient ${chainConfig.token} balance`);
      return;
    }

    // Ensure wallet is on the correct chain
    const onCorrectChain = await ensureCorrectChain();
    if (!onCorrectChain) return;

    setResult(null);
    setLastBetIsWin(null);
    directionRef.current = direction;

    const isUnder = direction === 'under';

    if (chainConfig.isNative) {
      nativeRoll(targetValue, isUnder, chainConfig);
    } else {
      gaslessRoll(targetValue, isUnder, betAmount);
    }
  };

  // Calculate Payouts
  const winChanceUnder = Math.max(1, targetValue);
  const payoutUnderVal = (betAmount * (99 / winChanceUnder));
  const payoutUnder = chainConfig.isNative ? payoutUnderVal.toFixed(8) : payoutUnderVal.toFixed(4);

  const winChanceOver = Math.max(1, 99 - targetValue);
  const payoutOverVal = (betAmount * (99 / winChanceOver));
  const payoutOver = chainConfig.isNative ? payoutOverVal.toFixed(8) : payoutOverVal.toFixed(4);

  const canPayUnder = bankrollAmount >= payoutUnderVal;
  const canPayOver = bankrollAmount >= payoutOverVal;

  return (
    <div className="min-h-screen min-h-[100dvh] bg-background text-white font-sans selection:bg-primary/30 flex flex-col items-center">
      <div className="w-full max-w-[480px] min-h-screen min-h-[100dvh] bg-background relative shadow-2xl flex flex-col">
        <Header chainConfig={chainConfig} />

        <main className="flex-1 flex flex-col items-center justify-start py-2 gap-2 w-full">

          <ChainSelector
            selectedChainId={selectedChainId}
            onSelect={handleChainSelect}
          />

          <GameDial
            value={targetValue}
            onChange={(v) => { setTargetValue(v); setResult(null); setLastBetIsWin(null); }}
            result={result}
            isRolling={isRolling}
            isWin={lastBetIsWin}
          />

          <BetControls
            betAmount={betAmount}
            fee={chainConfig.fee}
            token={chainConfig.token}
            isNative={chainConfig.isNative}
            targetValue={targetValue}
            isRolling={isRolling}
            isWin={lastBetIsWin}
          />

          {/* User Balance & Name */}
          {isConnected && (
            <div className="w-full max-w-sm px-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse-dot shrink-0" />
                <span className="text-xs font-mono font-semibold text-white">
                  {displayName}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-primary" />
                <div className="flex flex-col items-end">
                  <span className="text-base font-mono font-bold text-white">
                    {chainConfig.isNative ? userBalanceDisplay : `$${userBalanceDisplay}`}
                  </span>
                  <span className="text-[9px] font-mono text-gray-500">
                    {chainConfig.isNative ? balance.toFixed(8) : balance.toFixed(2)} {chainConfig.token}
                  </span>
                </div>
              </div>
            </div>
          )}

          <ActionButtons
            onRollUnder={() => handleRoll('under')}
            onRollOver={() => handleRoll('over')}
            targetValue={targetValue}
            disabledUnder={isRolling || !canPayUnder}
            disabledOver={isRolling || !canPayOver}
            isRolling={isRolling}
            payoutUnder={payoutUnder}
            payoutOver={payoutOver}
            token={chainConfig.token}
            isNative={chainConfig.isNative}
          />

          <History history={history} />

          <GlobalHistory refreshKey={betCount} chain={chainConfig.key} />

          <div className="mt-auto w-full">
            <ProvablyFair lastResult={lastRollResult} chainConfig={chainConfig} />
          </div>
        </main>
      </div>

      <Toast />
    </div>
  );
}

export default App;
