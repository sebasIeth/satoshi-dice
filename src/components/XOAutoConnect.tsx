import { useEffect, type ReactNode } from 'react';
import { useConnect, useAccount } from 'wagmi';
import { isXOAvailable } from '../connectors/xo-connector';

export default function XOAutoConnect({ children }: { children?: ReactNode }) {
  const { connectAsync, connectors } = useConnect();
  const { isConnected } = useAccount();

  useEffect(() => {
    if (isConnected) return;

    const timeout = setTimeout(async () => {
      if (!isXOAvailable()) return;

      const xo = connectors.find((c) => c.id === 'xo-connect');
      if (!xo) return;

      try {
        await connectAsync({ connector: xo });
      } catch (e) {
        console.error('[XOAutoConnect] connection failed:', e);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [isConnected, connectors, connectAsync]);

  return <>{children}</>;
}
