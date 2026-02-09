import { createConfig, http } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import {
    metaMaskWallet,
    walletConnectWallet,
    coinbaseWallet,
    rainbowWallet,
} from '@rainbow-me/rainbowkit/wallets';
import { xoConnector } from './connectors/xo-connector';

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

export const config = createConfig({
    chains: [baseSepolia],
    connectors: [xoConnector(), ...rainbowConnectors],
    transports: {
        [baseSepolia.id]: http('https://sepolia.base.org'),
    },
    ssr: false,
});
