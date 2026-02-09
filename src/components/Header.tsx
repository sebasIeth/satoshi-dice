import React from 'react';
import { Wallet, Building2 } from 'lucide-react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import { USDC_ADDRESS, USDC_ABI, DICE_GAME_ADDRESS } from '../abis';
import { getXOAlias } from '../connectors/xo-connector';

const Header: React.FC = () => {
    const { address, isConnected, isConnecting, connector } = useAccount();

    const { data: bankroll } = useReadContract({
        address: USDC_ADDRESS,
        abi: USDC_ABI,
        functionName: 'balanceOf',
        args: [DICE_GAME_ADDRESS],
        query: { refetchInterval: 5000 }
    });

    const { data: userBalance } = useReadContract({
        address: USDC_ADDRESS,
        abi: USDC_ABI,
        functionName: 'balanceOf',
        args: [address!],
        query: { enabled: !!address, refetchInterval: 2000 }
    });

    const bankrollAmount = bankroll ? parseFloat(formatUnits(bankroll, 6)) : 0;
    const userBalanceAmount = userBalance ? parseFloat(formatUnits(userBalance, 6)) : 0;

    const isXO = connector?.id === 'xo-connect';
    const alias = isXO ? getXOAlias() : null;

    return (
        <header className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-background/80 backdrop-blur-md sticky top-0 z-50">
            {/* Logo & Bankroll */}
            <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-primary/10 rounded-lg shadow-[0_0_12px_rgba(247,147,26,0.2)]">
                    <span className="text-xl leading-none block">🎲</span>
                </div>
                <div className="flex flex-col">
                    <h1 className="text-base font-extrabold tracking-wider text-white font-mono leading-none">
                        SATOSHI<span className="text-primary drop-shadow-[0_0_8px_rgba(247,147,26,0.5)]">DICE</span>
                    </h1>
                    <div className="flex items-center gap-1 text-[10px] text-gray-400 font-mono mt-0.5">
                        <Building2 className="w-3 h-3" />
                        <span>Bank: ${bankrollAmount.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            {/* Wallet / Connection */}
            <div className="flex items-center gap-2">
                {/* User balance badge */}
                {isConnected && (
                    <div className="flex items-center gap-1.5 bg-surface/80 px-2.5 py-1.5 rounded-lg border border-white/5">
                        <Wallet className="w-3 h-3 text-primary" />
                        <span className="text-xs font-mono font-bold text-white">${userBalanceAmount.toFixed(2)}</span>
                    </div>
                )}

                {isXO ? (
                    <div className="flex items-center gap-2 bg-surface px-3 py-1.5 rounded-lg border border-white/5">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse-dot" />
                        <span className="text-xs font-mono font-semibold text-white">
                            {alias || (address ? address.slice(0, 6) + '...' + address.slice(-4) : '')}
                        </span>
                    </div>
                ) : isConnecting && !isConnected ? (
                    <div className="flex items-center gap-2 bg-surface px-3 py-1.5 rounded-lg">
                        <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse-dot" />
                        <span className="text-xs text-gray-300 font-mono">Connecting...</span>
                    </div>
                ) : (
                    <ConnectButton showBalance={false} accountStatus="address" />
                )}
            </div>
        </header>
    );
};

export default Header;
