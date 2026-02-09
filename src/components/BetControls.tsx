import React from 'react';


interface BetControlsProps {
    betAmount: number;
    targetValue: number;
}

const BetControls: React.FC<BetControlsProps> = ({ betAmount, targetValue }) => {
    // Simplified logic for demo
    const winChance = targetValue;
    const multiplier = (99 / (Math.max(winChance, 1))).toFixed(4);
    const payout = (betAmount * parseFloat(multiplier)).toFixed(2);

    return (
        <div className="w-full max-w-sm flex flex-col gap-4 px-4">
            {/* Amount Display (Fixed) */}
            <div className="bg-surface p-1 rounded-xl flex items-center border border-white/10 shadow-lg">
                <div className="flex-1 px-4 py-2">
                    <label className="block text-xs text-gray-400 font-mono mb-1">BET AMOUNT</label>
                    <div className="flex items-center gap-2">
                        <span className="text-primary font-bold">USDC</span>
                        <span className="text-white font-mono font-bold text-lg">0.10</span>
                    </div>
                </div>
            </div>

            {/* Stats Grid - Labelled for Under to minimize confusion */}
            <div className="grid grid-cols-3 gap-2 opacity-60 hover:opacity-100 transition-opacity">
                <div className="bg-surface/30 p-2 rounded-xl border border-white/5 text-center">
                    <div className="text-[9px] text-gray-500 uppercase tracking-wider mb-1">Under Chance</div>
                    <div className="text-gray-300 font-mono font-bold text-xs">{winChance}%</div>
                </div>
                <div className="bg-surface/30 p-2 rounded-xl border border-white/5 text-center">
                    <div className="text-[9px] text-gray-500 uppercase tracking-wider mb-1">Under Mult</div>
                    <div className="text-gray-300 font-mono font-bold text-xs">{multiplier}x</div>
                </div>
                <div className="bg-surface/30 p-2 rounded-xl border border-white/5 text-center">
                    <div className="text-[9px] text-gray-500 uppercase tracking-wider mb-1">Under Pay</div>
                    <div className="text-gray-300 font-mono font-bold text-xs">{parseFloat(payout).toFixed(2)}</div>
                </div>
            </div>
        </div>
    );
};

export default BetControls;
