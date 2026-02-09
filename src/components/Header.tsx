import React from 'react';
import { Bitcoin, Building2 } from 'lucide-react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import { USDC_ADDRESS, USDC_ABI, DICE_GAME_ADDRESS } from '../abis';

const Header: React.FC = () => {
    const { data: bankroll } = useReadContract({
        address: USDC_ADDRESS,
        abi: USDC_ABI,
        functionName: 'balanceOf',
        args: [DICE_GAME_ADDRESS],
        query: { refetchInterval: 5000 }
    });

    const bankrollAmount = bankroll ? parseFloat(formatUnits(bankroll, 6)) : 0;

    return (
        <header className="flex items-center justify-between px-6 py-4 border-b border-surface bg-background/50 backdrop-blur-md sticky top-0 z-50">
            <div className="flex items-center gap-2">
                <div className="p-1.5 bg-primary/10 rounded-lg">
                    <Bitcoin className="w-6 h-6 text-primary" />
                </div>
                <div className="flex flex-col">
                    <h1 className="text-lg font-bold tracking-wider text-white font-mono leading-none">
                        SATOSHI<span className="text-primary">DICE</span>
                    </h1>
                    <div className="flex items-center gap-1 text-[10px] text-gray-400 font-mono mt-0.5">
                        <Building2 className="w-3 h-3" />
                        <span>Bank: ${bankrollAmount.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            <ConnectButton showBalance={true} accountStatus="address" />
        </header>
    );
};

export default Header;
