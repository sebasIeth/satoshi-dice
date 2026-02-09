import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import '@rainbow-me/rainbowkit/styles.css';
import App from './App.tsx';
import XOAutoConnect from './components/XOAutoConnect';
import SplashScreen from './components/SplashScreen';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { config } from './config';

const queryClient = new QueryClient();

function Root() {
  const [ready, setReady] = useState(false);

  return (
    <>
      {!ready && <SplashScreen onFinish={() => setReady(true)} />}
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider>
            <XOAutoConnect />
            <App />
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>
);
