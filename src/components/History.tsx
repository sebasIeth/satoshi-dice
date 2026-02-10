import React from 'react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { Dices } from 'lucide-react';

export interface HistoryItem {
    id: number;
    result: number;
    target: number;
    isWin: boolean;
    amount: number;
}

interface HistoryProps {
    history: HistoryItem[];
}

const History: React.FC<HistoryProps> = ({ history }) => {
    return (
        <div className="w-full px-4 mt-4">
            <div className="flex justify-between items-center mb-2 px-1">
                <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider font-semibold">Recent Rolls</span>
                {history.length > 0 && (
                    <span className="text-[10px] font-mono text-gray-600">{history.length} roll{history.length !== 1 ? 's' : ''}</span>
                )}
            </div>
            <div className="flex gap-2 justify-start overflow-x-auto pb-1 scrollbar-none min-h-[52px]">
                <AnimatePresence initial={false}>
                    {history.slice(0, 10).map((item) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, x: -30, scale: 0.7 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0, x: 30 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                            className={clsx(
                                "flex-shrink-0 w-[60px] rounded-xl flex flex-col items-center justify-center py-1.5 border font-mono",
                                item.isWin
                                    ? "bg-green-500/10 border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.15)]"
                                    : "bg-red-500/10 border-red-500/20"
                            )}
                        >
                            <span className={clsx(
                                "text-sm font-bold leading-none",
                                item.isWin ? "text-green-400" : "text-red-500"
                            )}>
                                {item.result}
                            </span>
                            <span className={clsx(
                                "text-[9px] mt-0.5 font-semibold",
                                item.isWin ? "text-green-400/60" : "text-red-500/60"
                            )}>
                                {item.isWin ? `+$${item.amount.toFixed(2)}` : `-$${item.amount.toFixed(2)}`}
                            </span>
                        </motion.div>
                    ))}
                </AnimatePresence>
                {history.length === 0 && (
                    <div className="flex items-center gap-2 py-2 px-1">
                        <Dices className="w-4 h-4 text-gray-600" />
                        <span className="text-gray-500 text-xs font-mono">Place your first bet!</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default History;
