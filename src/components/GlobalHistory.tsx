import { useState, useEffect } from 'react';
import { fetchBets, type BetRecord } from '../api';
import { clsx } from 'clsx';
import { ChevronDown, ChevronUp, Globe } from 'lucide-react';

interface GlobalHistoryProps {
  refreshKey: number;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.max(0, now - then);
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const PAGE_SIZE = 20;

const GlobalHistory: React.FC<GlobalHistoryProps> = ({ refreshKey }) => {
  const [bets, setBets] = useState<BetRecord[]>([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = () => {
      setIsLoading(true);
      fetchBets(50).then(data => {
        setBets(data);
        setIsLoading(false);
      });
    };
    load();
    const interval = setInterval(load, 10_000);
    return () => clearInterval(interval);
  }, [refreshKey]);

  const truncate = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  const visibleBets = bets.slice(0, visibleCount);
  const hasMore = visibleCount < bets.length;

  return (
    <div className="w-full px-4 mt-4">
      <div className="flex justify-between items-center mb-2 px-1">
        <div className="flex items-center gap-1.5">
          <Globe className="w-3 h-3 text-gray-500" />
          <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider font-semibold">Global History</span>
        </div>
        <span className="text-[10px] font-mono text-gray-600">{bets.length} bets</span>
      </div>

      <div className="bg-surface/30 rounded-xl border border-white/5 overflow-hidden">
        {/* Table Header */}
        <div className="flex items-center justify-between px-3 py-2 text-[9px] font-mono text-gray-500 uppercase tracking-wider border-b border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <span className="w-[72px]">Player</span>
            <span className="w-10 text-center">Roll</span>
            <span className="w-[60px] text-center">Target</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-12 text-right">P/L</span>
            <span className="w-10 text-right">Time</span>
          </div>
        </div>

        {/* Loading skeleton */}
        {isLoading && bets.length === 0 ? (
          <div className="p-2 space-y-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-2">
                <div className="skeleton h-3 w-24" />
                <div className="skeleton h-3 w-16" />
              </div>
            ))}
          </div>
        ) : bets.length === 0 ? (
          <div className="text-gray-500 text-xs font-mono p-6 text-center">No bets recorded yet</div>
        ) : (
          <div className="max-h-64 overflow-y-auto">
            {visibleBets.map((bet, index) => (
              <div
                key={bet._id}
                className={clsx(
                  'flex items-center justify-between px-3 py-2 text-[11px] font-mono transition-colors',
                  index % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.015]',
                  'hover:bg-white/[0.04]'
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="text-gray-500 w-[72px] truncate">{truncate(bet.player)}</span>
                  <span className={clsx(
                    "w-10 text-center font-bold",
                    bet.isWin ? "text-green-400" : "text-red-400"
                  )}>
                    {bet.result}
                  </span>
                  <div className="flex items-center gap-1 w-[60px] justify-center">
                    {bet.direction === 'under' ? (
                      <ChevronDown className="w-3 h-3 text-green-400/50" />
                    ) : (
                      <ChevronUp className="w-3 h-3 text-secondary/50" />
                    )}
                    <span className="text-gray-400">{bet.target}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={clsx(
                    "w-12 text-right font-bold",
                    bet.isWin ? "text-green-400" : "text-red-400"
                  )}>
                    {bet.isWin ? `+${bet.payout.toFixed(2)}` : `-${bet.amount.toFixed(2)}`}
                  </span>
                  <span className="text-gray-600 w-10 text-right text-[9px]">
                    {bet.createdAt ? timeAgo(bet.createdAt) : '-'}
                  </span>
                </div>
              </div>
            ))}

            {/* Load more */}
            {hasMore && (
              <button
                onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
                className="w-full py-2.5 text-[10px] font-mono text-gray-500 hover:text-gray-300 transition-colors border-t border-white/5 hover:bg-white/[0.02]"
              >
                Load more ({bets.length - visibleCount} remaining)
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GlobalHistory;
