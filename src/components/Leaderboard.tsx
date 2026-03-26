import { useState, useEffect } from 'react';
import { fetchLeaderboard, type LeaderboardEntry } from '../api';
import { clsx } from 'clsx';
import { Trophy } from 'lucide-react';

interface LeaderboardProps {
  refreshKey: number;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ refreshKey }) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = () => {
      setIsLoading(true);
      fetchLeaderboard(10).then(data => {
        setEntries(data);
        setIsLoading(false);
      });
    };
    load();
    const interval = setInterval(load, 15_000);
    return () => clearInterval(interval);
  }, [refreshKey]);

  const truncate = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const rankColor = (index: number) => {
    if (index === 0) return 'text-yellow-400';
    if (index === 1) return 'text-gray-300';
    if (index === 2) return 'text-amber-600';
    return 'text-gray-500';
  };

  return (
    <div className="w-full px-4 mt-4">
      <div className="flex justify-between items-center mb-2 px-1">
        <div className="flex items-center gap-1.5">
          <Trophy className="w-3 h-3 text-yellow-500" />
          <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider font-semibold">Ranking</span>
        </div>
        <span className="text-[10px] font-mono text-gray-600">{entries.length} players</span>
      </div>

      <div className="bg-surface/30 rounded-xl border border-white/5 overflow-hidden">
        {/* Table Header */}
        <div className="flex items-center justify-between px-3 py-2 text-[9px] font-mono text-gray-500 uppercase tracking-wider border-b border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <span className="w-5 text-center">#</span>
            <span className="w-[72px]">Player</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-10 text-center">Bets</span>
            <span className="w-10 text-center">Win%</span>
            <span className="w-14 text-right">Profit</span>
          </div>
        </div>

        {/* Loading skeleton */}
        {isLoading && entries.length === 0 ? (
          <div className="p-2 space-y-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-2">
                <div className="skeleton h-3 w-24" />
                <div className="skeleton h-3 w-16" />
              </div>
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="text-gray-500 text-xs font-mono p-6 text-center">No players yet</div>
        ) : (
          <div className="max-h-64 overflow-y-auto">
            {entries.map((entry, index) => (
              <div
                key={entry.player}
                className={clsx(
                  'flex items-center justify-between px-3 py-2 text-[11px] font-mono transition-colors',
                  index % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.015]',
                  'hover:bg-white/[0.04]'
                )}
              >
                <div className="flex items-center gap-2">
                  <span className={clsx('w-5 text-center font-bold', rankColor(index))}>
                    {index + 1}
                  </span>
                  <span className="text-gray-400 w-[72px] truncate">{truncate(entry.player)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-gray-400 w-10 text-center">{entry.totalBets}</span>
                  <span className={clsx(
                    'w-10 text-center font-semibold',
                    entry.winRate >= 50 ? 'text-green-400' : 'text-red-400'
                  )}>
                    {entry.winRate}%
                  </span>
                  <span className={clsx(
                    'w-14 text-right font-bold',
                    entry.netProfit >= 0 ? 'text-green-400' : 'text-red-400'
                  )}>
                    {entry.netProfit >= 0 ? '+' : ''}{entry.netProfit.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
