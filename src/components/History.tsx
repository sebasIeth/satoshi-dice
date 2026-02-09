import React from 'react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

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
        <div className="w-full px-4 mt-6">
            <div className="flex justify-between items-center mb-2 px-2">
                <span className="text-xs font-mono text-gray-500 uppercase">Recent History</span>
            </div>
            <div className="flex gap-2 justify-start overflow-x-hidden h-10">
                <AnimatePresence initial={false}>
                    {history.slice(0, 5).map((item) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, x: -20, scale: 0.8 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0 }}
                            className={clsx(
                                "flex-shrink-0 w-16 h-8 rounded-lg flex items-center justify-center border font-mono font-bold text-sm",
                                item.isWin
                                    ? "bg-green-500/10 border-green-500/30 text-green-400"
                                    : "bg-red-500/10 border-red-500/30 text-red-500"
                            )}
                        >
                            {item.result}
                        </motion.div>
                    ))}
                </AnimatePresence>
                {history.length === 0 && (
                    <div className="text-gray-600 text-xs italic py-2">No games yet</div>
                )}
            </div>
        </div>
    );
};

export default History;
