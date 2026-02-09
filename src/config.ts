import { createConfig, http } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import {
    metaMaskWallet,
    walletConnectWallet,
    coinbaseWallet,
    rainbowWallet,
} from '@rainbow-me/rainbowkit/wallets';
import { xoConnector } from './connectors/xo-connector';

const PROJECT_ID = 'YOUR_PROJECT_ID';

const isMainnet = import.meta.env.VITE_NETWORK === 'mainnet';
export const activeChain = isMainnet ? base : baseSepolia;

const rainbowConnectors = connectorsForWallets(
    [
        {
            groupName: 'Popular',
            wallets: [metaMaskWallet, rainbowWallet, coinbaseWallet, walletConnectWallet],
        },
    ],
    { appName: 'Satoshi Dice', projectId: PROJECT_ID },
);

export const config = createConfig({
    chains: [activeChain],
    connectors: [xoConnector(), ...rainbowConnectors],
    transports: {
        [base.id]: http('https://mainnet.base.org'),
        [baseSepolia.id]: http('https://sepolia.base.org'),
    },
    ssr: false,
});
