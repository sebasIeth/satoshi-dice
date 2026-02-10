import React from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';

interface ActionButtonsProps {
    onRollUnder: () => void;
    onRollOver: () => void;
    targetValue: number;
    disabledUnder: boolean;
    disabledOver: boolean;
    isRolling?: boolean;
    payoutUnder: string;
    payoutOver: string;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ onRollUnder, onRollOver, targetValue, disabledUnder, disabledOver, isRolling, payoutUnder, payoutOver }) => {
    return (
        <div className="w-full flex gap-3 px-4">
            {/* ROLL OVER (left, red) */}
            <motion.button
                whileTap={!disabledOver ? { scale: 0.95 } : undefined}
                onClick={onRollOver}
                disabled={disabledOver}
                className={clsx(
                    "flex-1 p-3 rounded-2xl relative overflow-hidden transition-all border",
                    disabledOver
                        ? "opacity-40 cursor-not-allowed bg-surface border-white/5"
                        : "bg-gradient-to-br from-red-500/10 to-surface border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.1)] hover:shadow-[0_0_30px_rgba(239,68,68,0.2)] hover:border-red-500/30 active:shadow-[0_0_30px_rgba(239,68,68,0.3)] cursor-pointer"
                )}
            >
                <div className="relative flex flex-col items-center gap-0.5">
                    {isRolling ? (
                        <>
                            <Loader2 className="w-5 h-5 text-red-400 animate-spin" />
                            <span className="text-xs text-gray-400 font-mono">Rolling...</span>
                        </>
                    ) : (
                        <>
                            <div className="flex items-center gap-1">
                                <ChevronUp className="w-4 h-4 text-red-400" />
                                <span className="text-xs text-red-400/80 font-bold tracking-widest">ROLL OVER</span>
                            </div>
                            <span className="text-2xl font-mono font-bold text-white">&gt; {targetValue}</span>
                            <div className="flex items-center gap-1">
                                <span className="text-[10px] text-gray-500 font-mono">Win:</span>
                                <span className="text-sm text-red-400 font-bold font-mono">${payoutOver}</span>
                            </div>
                        </>
                    )}
                </div>
            </motion.button>

            {/* ROLL UNDER (right, green) */}
            <motion.button
                whileTap={!disabledUnder ? { scale: 0.95 } : undefined}
                onClick={onRollUnder}
                disabled={disabledUnder}
                className={clsx(
                    "flex-1 p-3 rounded-2xl relative overflow-hidden transition-all border",
                    disabledUnder
                        ? "opacity-40 cursor-not-allowed bg-surface border-white/5"
                        : "bg-gradient-to-br from-green-500/10 to-surface border-green-500/20 shadow-[0_0_20px_rgba(34,197,94,0.1)] hover:shadow-[0_0_30px_rgba(34,197,94,0.2)] hover:border-green-500/30 active:shadow-[0_0_30px_rgba(34,197,94,0.3)] cursor-pointer"
                )}
            >
                <div className="relative flex flex-col items-center gap-0.5">
                    {isRolling ? (
                        <>
                            <Loader2 className="w-5 h-5 text-green-400 animate-spin" />
                            <span className="text-xs text-gray-400 font-mono">Rolling...</span>
                        </>
                    ) : (
                        <>
                            <div className="flex items-center gap-1">
                                <ChevronDown className="w-4 h-4 text-green-400" />
                                <span className="text-xs text-green-400/80 font-bold tracking-widest">ROLL UNDER</span>
                            </div>
                            <span className="text-2xl font-mono font-bold text-white">&lt; {targetValue}</span>
                            <div className="flex items-center gap-1">
                                <span className="text-[10px] text-gray-500 font-mono">Win:</span>
                                <span className="text-sm text-green-400 font-bold font-mono">${payoutUnder}</span>
                            </div>
                        </>
                    )}
                </div>
            </motion.button>
        </div>
    );
};

export default ActionButtons;
