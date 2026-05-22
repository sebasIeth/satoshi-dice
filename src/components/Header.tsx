import React, { useState } from 'react';
import { Building2, Settings } from 'lucide-react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import { USDC_ABI, DICE_GAME_ABI, DICE_GAME_NATIVE_ABI } from '../abis';
import { useBalance } from 'wagmi';
import type { ChainConfig } from '../chains';
import OwnerPanel from './OwnerPanel';

interface HeaderProps {
    chainConfig: ChainConfig;
}

const Header: React.FC<HeaderProps> = ({ chainConfig }) => {
    const { address, isConnected, isConnecting } = useAccount();
    const [ownerPanelOpen, setOwnerPanelOpen] = useState(false);

    const gameAbi = chainConfig.isNative ? DICE_GAME_NATIVE_ABI : DICE_GAME_ABI;

    const { data: contractOwner } = useReadContract({
        address: chainConfig.diceGameAddress,
        abi: gameAbi,
        functionName: 'owner',
        chainId: chainConfig.chain.id,
    });

    const isOwner = !!(
        address &&
        contractOwner &&
        address.toLowerCase() === (contractOwner as string).toLowerCase()
    );

    // ERC20 bankroll
    const { data: erc20Bankroll } = useReadContract({
        address: chainConfig.tokenAddress!,
        abi: USDC_ABI,
        functionName: 'balanceOf',
        args: [chainConfig.diceGameAddress],
        chainId: chainConfig.chain.id,
        query: { enabled: !chainConfig.isNative, refetchInterval: 5000 },
    });

    // Native bankroll
    const { data: nativeBankroll } = useBalance({
        address: chainConfig.diceGameAddress,
        chainId: chainConfig.chain.id,
        query: { enabled: chainConfig.isNative, refetchInterval: 5000 },
    });

    const bankrollAmount = chainConfig.isNative
        ? (nativeBankroll ? parseFloat(nativeBankroll.formatted) : 0)
        : (erc20Bankroll ? parseFloat(formatUnits(erc20Bankroll, chainConfig.decimals)) : 0);

    const bankrollDisplay = chainConfig.isNative
        ? `${bankrollAmount.toFixed(6)} ${chainConfig.token}`
        : `$${bankrollAmount.toFixed(2)}`;

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
                        <span>Bank: {bankrollDisplay}</span>
                    </div>
                </div>
            </div>

            {/* Wallet / Connection */}
            <div className="flex items-center gap-2">
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
                <OwnerPanel isOpen={ownerPanelOpen} onClose={() => setOwnerPanelOpen(false)} chainConfig={chainConfig} />
            )}
        </header>
    );
};

export default Header;
