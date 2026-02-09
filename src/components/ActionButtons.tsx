import React from 'react';
import { motion } from 'framer-motion';

interface ActionButtonsProps {
    onRollUnder: () => void;
    onRollOver: () => void;
    targetValue: number;
    disabled: boolean;
    payoutUnder: string;
    payoutOver: string;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ onRollUnder, onRollOver, targetValue, disabled, payoutUnder, payoutOver }) => {
    return (
        <div className="w-full flex gap-3 px-4 mt-2">
            <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onRollUnder}
                disabled={disabled}
                className="flex-1 bg-gradient-to-br from-surface to-background border border-primary/30 p-4 rounded-2xl relative overflow-hidden group shadow-[0_0_20px_rgba(247,147,26,0.1)] active:shadow-[0_0_30px_rgba(247,147,26,0.3)] transition-all"
            >
                <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors" />
                <div className="relative flex flex-col items-center">
                    <span className="text-xs text-primary/70 font-bold tracking-widest mb-1">ROLL UNDER</span>
                    <span className="text-2xl font-mono font-bold text-white mb-1">{targetValue}</span>
                    <span className="text-[10px] text-gray-400 font-mono">Win: <span className="text-green-400 font-bold">{payoutUnder}</span></span>
                </div>
            </motion.button>

            <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onRollOver}
                disabled={disabled}
                className="flex-1 bg-gradient-to-br from-surface to-background border border-secondary/30 p-4 rounded-2xl relative overflow-hidden group shadow-[0_0_20px_rgba(0,243,255,0.1)] active:shadow-[0_0_30px_rgba(0,243,255,0.3)] transition-all"
            >
                <div className="absolute inset-0 bg-secondary/5 group-hover:bg-secondary/10 transition-colors" />
                <div className="relative flex flex-col items-center">
                    <span className="text-xs text-secondary/70 font-bold tracking-widest mb-1">ROLL OVER</span>
                    <span className="text-2xl font-mono font-bold text-white mb-1">{targetValue}</span>
                    <span className="text-[10px] text-gray-400 font-mono">Win: <span className="text-green-400 font-bold">{payoutOver}</span></span>
                </div>
            </motion.button>
        </div>
    );
};

export default ActionButtons;
