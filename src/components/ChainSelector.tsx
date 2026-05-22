import React from 'react';
import { clsx } from 'clsx';
import { CHAIN_CONFIGS } from '../chains';
import { base, polygon } from 'viem/chains';
import { rootstock } from '../chains';

const CHAINS = [
  { id: base.id, label: 'Base', token: 'USDC', color: 'blue' },
  { id: polygon.id, label: 'Polygon', token: 'USDC', color: 'purple' },
  { id: rootstock.id, label: 'Rootstock', token: 'RBTC', color: 'orange' },
] as const;

const colorMap: Record<string, { active: string; ring: string }> = {
  blue: { active: 'bg-blue-500/20 border-blue-500/50 text-blue-400', ring: 'shadow-[0_0_12px_rgba(59,130,246,0.3)]' },
  purple: { active: 'bg-purple-500/20 border-purple-500/50 text-purple-400', ring: 'shadow-[0_0_12px_rgba(168,85,247,0.3)]' },
  orange: { active: 'bg-orange-500/20 border-orange-500/50 text-orange-400', ring: 'shadow-[0_0_12px_rgba(249,115,22,0.3)]' },
};

interface ChainSelectorProps {
  selectedChainId: number;
  onSelect: (chainId: number) => void;
}

const ChainSelector: React.FC<ChainSelectorProps> = ({ selectedChainId, onSelect }) => {
  return (
    <div className="w-full px-4 pt-1 pb-1">
      <div className="flex gap-2">
        {CHAINS.map((c) => {
          const isActive = selectedChainId === c.id;
          const cfg = CHAIN_CONFIGS[c.id];
          const isDeployed = cfg && cfg.diceGameAddress !== '0x0000000000000000000000000000000000000000';
          const colors = colorMap[c.color];

          return (
            <button
              key={c.id}
              onClick={() => onSelect(c.id)}
              disabled={!isDeployed}
              className={clsx(
                'flex-1 py-2 px-2 rounded-xl border text-[10px] font-mono font-bold uppercase tracking-wider transition-all',
                isActive
                  ? `${colors.active} ${colors.ring}`
                  : isDeployed
                    ? 'bg-surface/50 border-white/5 text-gray-500 hover:text-gray-300 hover:border-white/10'
                    : 'bg-surface/20 border-white/5 text-gray-700 cursor-not-allowed opacity-50',
              )}
            >
              <div className="flex flex-col items-center gap-0.5">
                <span>{c.label}</span>
                <span className={clsx(
                  'text-[8px]',
                  isActive ? 'opacity-80' : 'text-gray-600'
                )}>
                  {c.token}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ChainSelector;
