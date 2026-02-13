import React, { useState } from 'react';
import { Building2, Settings } from 'lucide-react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import { USDC_ADDRESS, USDC_ABI, DICE_GAME_ADDRESS, DICE_GAME_ABI } from '../abis';
import { activeChain } from '../config';
import OwnerPanel from './OwnerPanel';

const Header: React.FC = () => {
    const { address, isConnected, isConnecting } = useAccount();
    const [ownerPanelOpen, setOwnerPanelOpen] = useState(false);

    const { data: contractOwner } = useReadContract({
        address: DICE_GAME_ADDRESS,
        abi: DICE_GAME_ABI,
        functionName: 'owner',
        chainId: activeChain.id,
    });

    const isOwner = !!(
        address &&
        contractOwner &&
        address.toLowerCase() === (contractOwner as string).toLowerCase()
    );

    const { data: bankroll } = useReadContract({
        address: USDC_ADDRESS,
        abi: USDC_ABI,
        functionName: 'balanceOf',
        args: [DICE_GAME_ADDRESS],
        chainId: activeChain.id,
        query: { refetchInterval: 5000 }
    });

    const bankrollAmount = bankroll ? parseFloat(formatUnits(bankroll, 6)) : 0;

    return (
        <header className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-background/80 backdrop-blur-md sticky top-0 z-50">
            {/* Logo & Bankroll */}
            <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-xl shadow-[0_0_16px_rgba(247,147,26,0.3)]">
                    <span className="text-3xl leading-none block">🎲</span>
                </div>
                <div className="flex flex-col">
                    <h1 className="text-2xl font-extrabold tracking-wider text-white font-mono leading-none">
                        SATOSHI<span className="text-primary drop-shadow-[0_0_12px_rgba(247,147,26,0.6)]">DICE</span>
                    </h1>
                    <div className="flex items-center gap-1 text-[11px] text-gray-400 font-mono mt-1">
                        <Building2 className="w-3.5 h-3.5" />
                        <span>Bank: ${bankrollAmount.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            {/* Wallet / Connection */}
            <div className="flex items-center gap-2">
                {/* Owner settings button */}
                {isOwner && (
                    <button
                        onClick={() => setOwnerPanelOpen(true)}
                        className="p-1.5 rounded-lg bg-surface/80 border border-white/5 text-gray-400 hover:text-primary transition-colors"
                        title="Owner Panel"
                    >
                        <Settings className="w-4 h-4" />
                    </button>
                )}

                {isConnecting && !isConnected ? (
                    <div className="flex items-center gap-2 bg-surface px-3 py-1.5 rounded-lg">
                        <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse-dot" />
                        <span className="text-xs text-gray-300 font-mono">Connecting...</span>
                    </div>
                ) : !isConnected ? (
                    <ConnectButton showBalance={false} accountStatus="address" />
                ) : null}
            </div>

            {isOwner && (
                <OwnerPanel isOpen={ownerPanelOpen} onClose={() => setOwnerPanelOpen(false)} />
            )}
        </header>
    );
};

export default Header;
