import React, { useState } from 'react';
import { X, Copy, Check, ArrowDownToLine } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { USDC_ADDRESS, USDC_ABI, DICE_GAME_ADDRESS, DICE_GAME_ABI } from '../abis';
import { activeChain } from '../config';
import { showToast } from './Toast';

interface OwnerPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

const OwnerPanel: React.FC<OwnerPanelProps> = ({ isOpen, onClose }) => {
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [copied, setCopied] = useState(false);

    const { data: contractBalance, refetch: refetchBalance } = useReadContract({
        address: USDC_ADDRESS,
        abi: USDC_ABI,
        functionName: 'balanceOf',
        args: [DICE_GAME_ADDRESS],
        chainId: activeChain.id,
        query: { refetchInterval: 5000 },
    });

    const { writeContract, data: txHash, isPending } = useWriteContract();

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash: txHash,
    });

    React.useEffect(() => {
        if (isSuccess) {
            showToast('success', `Withdrew ${withdrawAmount} USDC`);
            setWithdrawAmount('');
            refetchBalance();
        }
    }, [isSuccess]);

    const balanceFormatted = contractBalance
        ? parseFloat(formatUnits(contractBalance, 6)).toFixed(2)
        : '0.00';

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(DICE_GAME_ADDRESS);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // fallback
        }
    };

    const handleWithdraw = () => {
        const val = parseFloat(withdrawAmount);
        if (!val || val <= 0) {
            showToast('error', 'Enter a valid amount');
            return;
        }
        writeContract(
            {
                address: DICE_GAME_ADDRESS,
                abi: DICE_GAME_ABI,
                functionName: 'withdraw',
                args: [parseUnits(withdrawAmount, 6)],
                chainId: activeChain.id,
            },
            {
                onError: (err) => {
                    showToast('error', err.message.length > 80 ? err.message.slice(0, 80) + '...' : err.message);
                },
            },
        );
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-[400px] bg-surface border border-white/10 rounded-2xl p-5 shadow-2xl"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
                                Owner Panel
                            </h2>
                            <button
                                onClick={onClose}
                                className="text-gray-500 hover:text-white transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Contract Address */}
                        <div className="space-y-1.5 mb-4">
                            <label className="text-[10px] text-gray-500 font-mono font-semibold uppercase">
                                Contract Address
                            </label>
                            <div className="flex items-center gap-2 bg-background p-2.5 rounded-lg border border-white/5">
                                <span className="text-xs font-mono text-gray-300 truncate flex-1">
                                    {DICE_GAME_ADDRESS}
                                </span>
                                <button
                                    onClick={handleCopy}
                                    className="text-gray-500 hover:text-white transition-colors shrink-0"
                                >
                                    {copied ? (
                                        <Check className="w-3.5 h-3.5 text-green-400" />
                                    ) : (
                                        <Copy className="w-3.5 h-3.5" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Contract Balance */}
                        <div className="space-y-1.5 mb-5">
                            <label className="text-[10px] text-gray-500 font-mono font-semibold uppercase">
                                Contract Balance
                            </label>
                            <div className="bg-background p-2.5 rounded-lg border border-white/5">
                                <span className="text-lg font-mono font-bold text-white">
                                    ${balanceFormatted}
                                </span>
                                <span className="text-xs text-gray-500 ml-1.5">USDC</span>
                            </div>
                        </div>

                        {/* Withdraw */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] text-gray-500 font-mono font-semibold uppercase">
                                Withdraw USDC
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={withdrawAmount}
                                    onChange={(e) => setWithdrawAmount(e.target.value)}
                                    className="flex-1 bg-background border border-white/10 rounded-lg px-3 py-2 text-sm font-mono text-white placeholder-gray-600 outline-none focus:border-primary/50 transition-colors"
                                />
                                <button
                                    onClick={handleWithdraw}
                                    disabled={isPending || isConfirming}
                                    className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 disabled:bg-primary/30 disabled:cursor-not-allowed text-black font-mono font-bold text-xs px-4 py-2 rounded-lg transition-colors"
                                >
                                    {isPending || isConfirming ? (
                                        <div className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                    ) : (
                                        <ArrowDownToLine className="w-3.5 h-3.5" />
                                    )}
                                    {isPending ? 'Sign...' : isConfirming ? 'Confirming...' : 'Withdraw'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default OwnerPanel;
