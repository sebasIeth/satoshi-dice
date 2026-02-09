import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { baseSepolia } from 'wagmi/chains';

export const config = getDefaultConfig({
    appName: 'Satoshi Dice',
    projectId: 'YOUR_PROJECT_ID', // TODO: Get a project ID from WalletConnect or use public one for dev
    chains: [baseSepolia],
    ssr: false, // Vite is client-side only
});
