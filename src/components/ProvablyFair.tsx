import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Lock, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProvablyFairProps {
    lastResult: {
        txHash: string;
        blockNumber?: number;
        player: string;
        roll: number;
    } | null;
}

const ProvablyFair: React.FC<ProvablyFairProps> = ({ lastResult }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="w-full px-4 mt-8 pb-8">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between text-gray-500 text-xs uppercase font-mono tracking-wider py-2 border-b border-white/5 hover:text-white transition-colors"
            >
                <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Provably Fair (On-Chain)</span>
                </div>
                {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="pt-4 flex flex-col gap-3">
                            <div className="space-y-1">
                                <label className="text-[10px] text-gray-500 font-mono">ENTROPY SOURCE (Player)</label>
                                <div className="flex items-center gap-2 bg-surface p-2 rounded text-xs font-mono text-gray-300 truncate border border-white/5">
                                    <span className="truncate">{lastResult?.player || "Not played yet"}</span>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] text-gray-500 font-mono">PROOF (Transaction Hash)</label>
                                <div className="flex items-center gap-2 bg-surface p-2 rounded text-xs font-mono text-gray-300 truncate border border-white/5">
                                    <Lock className="w-3 h-3 flex-shrink-0" />
                                    <span className="truncate">{lastResult?.txHash || "Waiting for roll..."}</span>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] text-gray-500 font-mono">RESULT</label>
                                <div className="text-xs font-mono text-white font-bold">{lastResult?.roll ?? "-"}</div>
                            </div>

                            <div className="text-[10px] text-gray-600 italic mt-2">
                                * Randomness generated on-chain using Block Timestamp + PrevRandao.
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ProvablyFair;
