import React from 'react';
import { Lock } from 'lucide-react';

interface BetControlsProps {
    betAmount: number;
    targetValue: number;
}

const BetControls: React.FC<BetControlsProps> = ({ betAmount, targetValue }) => {
    const winChanceUnder = Math.max(targetValue, 1);
    const multiplierUnder = (99 / winChanceUnder);
    const payoutUnder = (betAmount * multiplierUnder);

    const winChanceOver = Math.max(99 - targetValue, 1);
    const multiplierOver = (99 / winChanceOver);
    const payoutOver = (betAmount * multiplierOver);

    return (
        <div className="w-full max-w-sm flex flex-col gap-3 px-4">
            {/* Amount Display (Fixed) */}
            <div className="bg-surface p-1 rounded-xl flex items-center border border-white/10 shadow-lg">
                <div className="flex-1 px-4 py-2">
                    <div className="flex items-center gap-1.5 mb-1">
                        <label className="block text-[10px] text-gray-400 font-mono">BET AMOUNT</label>
                        <div className="flex items-center gap-0.5 bg-white/5 px-1.5 py-0.5 rounded text-[8px] text-gray-500 font-mono">
                            <Lock className="w-2.5 h-2.5" />
                            FIXED
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-primary font-bold text-sm">USDC</span>
                        <span className="text-white font-mono font-bold text-lg">0.10</span>
                    </div>
                </div>
            </div>

            {/* Stats Grid - Both Directions */}
            <div className="grid grid-cols-2 gap-2">
                {/* Under stats */}
                <div className="bg-surface/50 p-2.5 rounded-xl border border-green-500/10">
                    <div className="text-[9px] text-green-400/70 uppercase tracking-wider font-bold mb-2">Under Stats</div>
                    <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] text-gray-500 font-mono">Chance</span>
                            <span className="text-gray-200 font-mono font-bold text-xs">{winChanceUnder}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] text-gray-500 font-mono">Multi</span>
                            <span className="text-gray-200 font-mono font-bold text-xs">{multiplierUnder.toFixed(2)}x</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] text-gray-500 font-mono">Payout</span>
                            <span className="text-green-400 font-mono font-bold text-xs">${payoutUnder.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Over stats */}
                <div className="bg-surface/50 p-2.5 rounded-xl border border-secondary/10">
                    <div className="text-[9px] text-secondary/70 uppercase tracking-wider font-bold mb-2">Over Stats</div>
                    <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] text-gray-500 font-mono">Chance</span>
                            <span className="text-gray-200 font-mono font-bold text-xs">{winChanceOver}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] text-gray-500 font-mono">Multi</span>
                            <span className="text-gray-200 font-mono font-bold text-xs">{multiplierOver.toFixed(2)}x</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] text-gray-500 font-mono">Payout</span>
                            <span className="text-secondary font-mono font-bold text-xs">${payoutOver.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BetControls;
