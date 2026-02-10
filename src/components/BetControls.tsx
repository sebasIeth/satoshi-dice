import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Loader2 } from 'lucide-react';

interface BetControlsProps {
    betAmount: number;
    targetValue: number;
    isRolling?: boolean;
    isWin?: boolean | null;
}

const BetControls: React.FC<BetControlsProps> = ({ isRolling, isWin }) => {
    return (
        <div className="w-full max-w-sm flex gap-3 px-4 items-stretch">
            {/* Amount Display (Fixed) */}
            <div className="flex-1 bg-surface p-3 rounded-xl flex items-center border border-white/10 shadow-lg">
                <div>
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

            {/* WIN / LOSE Indicator */}
            <div className="w-28 bg-surface rounded-xl border border-white/10 shadow-lg flex items-center justify-center overflow-hidden">
                <AnimatePresence mode="wait">
                    {isRolling ? (
                        <motion.div
                            key="spinning"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0, scale: 0.5 }}
                            className="flex flex-col items-center gap-1"
                        >
                            <Loader2 className="w-6 h-6 text-primary animate-spin" />
                            <span className="text-[10px] text-gray-500 font-mono tracking-wider">WAITING...</span>
                        </motion.div>
                    ) : isWin !== null && isWin !== undefined ? (
                        <motion.div
                            key="result"
                            initial={{ rotateY: 90, scale: 0.3, opacity: 0 }}
                            animate={{ rotateY: 0, scale: 1, opacity: 1 }}
                            transition={{ type: "spring", stiffness: 260, damping: 20 }}
                            className="flex flex-col items-center"
                        >
                            <span className={`text-2xl font-bold font-mono tracking-wider ${isWin ? 'text-green-400 drop-shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]'}`}>
                                {isWin ? 'WIN' : 'LOSE'}
                            </span>
                        </motion.div>
                    ) : (
                        <motion.span
                            key="idle"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-xs text-gray-600 font-mono"
                        >
                            —
                        </motion.span>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default BetControls;
