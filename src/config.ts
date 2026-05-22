import { createConfig, http } from 'wagmi';
import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import {
    metaMaskWallet,
    walletConnectWallet,
    coinbaseWallet,
    rainbowWallet,
} from '@rainbow-me/rainbowkit/wallets';
import { xoConnector } from './connectors/xo-connector';
import { SUPPORTED_CHAINS, CHAIN_CONFIGS } from './chains';

const PROJECT_ID = 'YOUR_PROJECT_ID';

const rainbowConnectors = connectorsForWallets(
    [
        {
            groupName: 'Popular',
            wallets: [metaMaskWallet, rainbowWallet, coinbaseWallet, walletConnectWallet],
        },
    ],
    { appName: 'Satoshi Dice', projectId: PROJECT_ID },
);

const transports: Record<number, ReturnType<typeof http>> = {};
for (const chain of SUPPORTED_CHAINS) {
    const cfg = CHAIN_CONFIGS[chain.id];
    if (cfg) {
        transports[chain.id] = http(cfg.rpcUrl, {
            retryCount: 3,
            retryDelay: 200,
            timeout: 15_000,
        });
    }
}

export const config = createConfig({
    chains: SUPPORTED_CHAINS,
    connectors: [xoConnector(), ...rainbowConnectors],
    transports: transports as any,
    ssr: false,
});
