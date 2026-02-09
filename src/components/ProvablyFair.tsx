import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Lock, ShieldCheck, ExternalLink, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProvablyFairProps {
    lastResult: {
        txHash: string;
        blockNumber?: number;
        player: string;
        roll: number;
    } | null;
}

const BASESCAN_URL = 'https://sepolia.basescan.org/tx/';

const ProvablyFair: React.FC<ProvablyFairProps> = ({ lastResult }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleCopy = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // fallback: do nothing
        }
    };

    return (
        <div className="w-full px-4 mt-6 pb-8">
            {/* Provably fair badge - always visible */}
            {lastResult && (
                <div className="flex items-center justify-center gap-2 mb-3">
                    <div className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 px-3 py-1 rounded-full">
                        <ShieldCheck className="w-3.5 h-3.5 text-green-400" />
                        <span className="text-[10px] font-mono text-green-400 font-semibold">Verified On-Chain</span>
                    </div>
                </div>
            )}

            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between text-gray-400 text-xs uppercase font-mono tracking-wider py-2.5 border-b border-white/5 hover:text-white transition-colors"
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
                            {/* Player */}
                            <div className="space-y-1">
                                <label className="text-[10px] text-gray-500 font-mono font-semibold">ENTROPY SOURCE (Player)</label>
                                <div className="flex items-center gap-2 bg-surface p-2.5 rounded-lg text-xs font-mono text-gray-300 border border-white/5">
                                    <span className="truncate flex-1">{lastResult?.player || "Not played yet"}</span>
                                    {lastResult?.player && (
                                        <button
                                            onClick={() => handleCopy(lastResult.player)}
                                            className="text-gray-500 hover:text-white transition-colors shrink-0"
                                        >
                                            {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Transaction Hash */}
                            <div className="space-y-1">
                                <label className="text-[10px] text-gray-500 font-mono font-semibold">PROOF (Transaction Hash)</label>
                                <div className="flex items-center gap-2 bg-surface p-2.5 rounded-lg text-xs font-mono text-gray-300 border border-white/5">
                                    <Lock className="w-3.5 h-3.5 flex-shrink-0 text-gray-500" />
                                    {lastResult?.txHash ? (
                                        <>
                                            <a
                                                href={`${BASESCAN_URL}${lastResult.txHash}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="truncate flex-1 text-primary hover:text-primary/80 transition-colors underline underline-offset-2 decoration-primary/30"
                                            >
                                                {lastResult.txHash}
                                            </a>
                                            <a
                                                href={`${BASESCAN_URL}${lastResult.txHash}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-gray-500 hover:text-white transition-colors shrink-0"
                                            >
                                                <ExternalLink className="w-3.5 h-3.5" />
                                            </a>
                                            <button
                                                onClick={() => handleCopy(lastResult.txHash)}
                                                className="text-gray-500 hover:text-white transition-colors shrink-0"
                                            >
                                                {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                                            </button>
                                        </>
                                    ) : (
                                        <span className="truncate flex-1 text-gray-500 italic">Waiting for roll...</span>
                                    )}
                                </div>
                            </div>

                            {/* Block Number */}
                            {lastResult?.blockNumber && (
                                <div className="space-y-1">
                                    <label className="text-[10px] text-gray-500 font-mono font-semibold">BLOCK NUMBER</label>
                                    <div className="text-xs font-mono text-gray-300 font-bold">#{lastResult.blockNumber}</div>
                                </div>
                            )}

                            {/* Result */}
                            <div className="space-y-1">
                                <label className="text-[10px] text-gray-500 font-mono font-semibold">RESULT</label>
                                <div className="text-xs font-mono text-white font-bold">{lastResult?.roll ?? "-"}</div>
                            </div>

                            <div className="text-[10px] text-gray-600 mt-2 bg-surface/50 p-2.5 rounded-lg border border-white/5">
                                Randomness generated on-chain using Block Timestamp + PrevRandao. Verify on{' '}
                                <a
                                    href="https://sepolia.basescan.org"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:text-primary/80 underline underline-offset-2"
                                >
                                    BaseScan
                                </a>.
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ProvablyFair;
