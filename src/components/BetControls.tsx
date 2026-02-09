import React from 'react';


interface BetControlsProps {
    betAmount: number;
    setBetAmount: (amount: number) => void;
    targetValue: number;
}

const BetControls: React.FC<BetControlsProps> = ({ betAmount, setBetAmount, targetValue }) => {
    // Local state to handle decimal inputs cleanly (e.g. "0.5")
    const [inputValue, setInputValue] = React.useState(betAmount.toString());

    // Sync local input when betAmount changes externally (e.g. via 2x button)
    React.useEffect(() => {
        // Only sync if the parsed input value is different to avoid cursor jumping/formatting wars
        // OR simply sync always but formatted? 
        // Simple sync is safer for buttons:
        if (parseFloat(inputValue) !== betAmount) {
            setInputValue(betAmount.toString());
        }
    }, [betAmount]);

    // Simplified logic for demo
    const winChance = targetValue;
    const multiplier = (99 / (Math.max(winChance, 1))).toFixed(4);
    const payout = (betAmount * parseFloat(multiplier)).toFixed(2);

    const handleDouble = () => {
        const newAmount = parseFloat((betAmount * 2).toFixed(2));
        setBetAmount(newAmount);
        setInputValue(newAmount.toString());
    };

    const handleHalf = () => {
        const newAmount = parseFloat((betAmount / 2).toFixed(2));
        setBetAmount(newAmount);
        setInputValue(newAmount.toString());
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setInputValue(value);

        // Only update parent state if it's a valid number
        const floatVal = parseFloat(value);
        if (!isNaN(floatVal)) {
            setBetAmount(floatVal);
        } else if (value === '') {
            setBetAmount(0); // Optional: handle empty as 0
        }
    };

    return (
        <div className="w-full max-w-sm flex flex-col gap-4 px-4">
            {/* Amount Controls */}
            <div className="bg-surface p-1 rounded-xl flex items-center border border-white/10 shadow-lg">
                <div className="flex-1 px-4 py-2">
                    <label className="block text-xs text-gray-400 font-mono mb-1">BET AMOUNT</label>
                    <div className="flex items-center gap-2">
                        <span className="text-primary font-bold">USDC</span>
                        <input
                            type="number"
                            value={inputValue}
                            onChange={handleInputChange}
                            className="bg-transparent border-none outline-none text-white font-mono font-bold w-full text-lg"
                            step="0.01"
                            min="0.50"
                        />
                    </div>
                </div>
                <div className="flex gap-1 pr-1">
                    <button onClick={handleHalf} className="px-3 py-2 bg-background/50 text-gray-400 hover:text-white rounded-lg font-mono text-sm transition-colors">/2</button>
                    <button onClick={handleDouble} className="px-3 py-2 bg-background/50 text-gray-400 hover:text-white rounded-lg font-mono text-sm transition-colors">2x</button>
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
