import { useState, useEffect } from 'react';
import { fetchBets, type BetRecord } from '../api';
import { clsx } from 'clsx';

interface GlobalHistoryProps {
  refreshKey: number;
}

const GlobalHistory: React.FC<GlobalHistoryProps> = ({ refreshKey }) => {
  const [bets, setBets] = useState<BetRecord[]>([]);

  useEffect(() => {
    const load = () => fetchBets(50).then(setBets);
    load();
    const interval = setInterval(load, 10_000);
    return () => clearInterval(interval);
  }, [refreshKey]);

  const truncate = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <div className="w-full px-4 mt-4">
      <div className="flex justify-between items-center mb-2 px-2">
        <span className="text-xs font-mono text-gray-500 uppercase">Global History</span>
        <span className="text-xs font-mono text-gray-600">{bets.length} bets</span>
      </div>

      <div className="bg-surface/30 rounded-xl border border-white/5 max-h-64 overflow-y-auto">
        {bets.length === 0 ? (
          <div className="text-gray-600 text-xs italic p-4 text-center">No bets recorded yet</div>
        ) : (
          <div className="divide-y divide-white/5">
            {bets.map((bet) => (
              <div
                key={bet._id}
                className={clsx(
                  'flex items-center justify-between px-3 py-2 text-xs font-mono',
                  bet.isWin ? 'text-green-400' : 'text-red-400'
                )}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-gray-500 shrink-0">{truncate(bet.player)}</span>
                  <span className="shrink-0">rolled {bet.result}</span>
                  <span className="text-gray-500 shrink-0">
                    {bet.direction} {bet.target}
                  </span>
                </div>
                <span className="shrink-0 font-bold ml-2">
                  {bet.isWin ? `+${bet.payout.toFixed(2)}` : `-${bet.amount.toFixed(2)}`}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GlobalHistory;
