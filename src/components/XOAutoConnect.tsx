import { useEffect, type ReactNode } from 'react';
import { useConnect, useAccount } from 'wagmi';

export default function XOAutoConnect({ children }: { children?: ReactNode }) {
  const { connectAsync, connectors } = useConnect();
  const { isConnected } = useAccount();

  useEffect(() => {
    if (isConnected) return;

    const xo = connectors.find((c) => c.id === 'xo-connect');
    if (!xo) return;

    let cancelled = false;

    // XOConnectProvider.connect() internamente espera hasta 5s
    // a que window["XOConnect"] aparezca, así que no necesitamos
    // chequear isXOAvailable() antes.
    connectAsync({ connector: xo }).catch((e) => {
      if (!cancelled) {
        console.debug('[XOAutoConnect] not in XO context or connection failed:', e?.message);
        alert('[XO DEBUG] ' + (e?.stack || e?.message || String(e)));
      }
    });

    return () => { cancelled = true; };
  }, [isConnected, connectors, connectAsync]);

  return <>{children}</>;
}
