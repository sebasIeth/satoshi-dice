import { createConnector } from 'wagmi';
import { XOConnectProvider } from 'xo-connect';
import type { Address } from 'viem';
import { DEFAULT_CHAIN_ID, CHAIN_CONFIGS } from '../chains';

const defaultConfig = CHAIN_CONFIGS[DEFAULT_CHAIN_ID]!;

let xoAlias: string | null = null;
let currentChainId: number = DEFAULT_CHAIN_ID;

export function getXOAlias(): string | null {
  return xoAlias;
}

function getEvmAddress(client: any): Address | null {
  if (!client?.currencies) return null;
  const evm = client.currencies.find((c: any) => c.symbol === 'ETH' && c.address?.startsWith('0x'))
    || client.currencies.find((c: any) => c.address?.startsWith('0x'));
  return evm?.address as Address || null;
}

export function xoConnector() {
  let provider: XOConnectProvider | null = null;

  return createConnector((config) => ({
    id: 'xo-connect',
    name: 'XO Wallet',
    type: 'xo-connect',

    async connect(parameters?: { chainId?: number; isReconnecting?: boolean }) {
      void parameters;

      const chainIdHex = `0x${DEFAULT_CHAIN_ID.toString(16)}`;

      provider = new XOConnectProvider({
        debug: import.meta.env.DEV,
        defaultChainId: chainIdHex,
        rpcs: { [chainIdHex]: defaultConfig.rpcUrl },
      });

      const rawAccounts = await provider.request({
        method: 'eth_requestAccounts',
      });
      let accounts = (Array.isArray(rawAccounts) ? rawAccounts : [rawAccounts]).filter(Boolean) as Address[];

      const client = await provider.getClient();
      xoAlias = client?.alias || null;

      if (accounts.length === 0) {
        const evmAddr = getEvmAddress(client);
        if (evmAddr) accounts = [evmAddr];
      }

      currentChainId = DEFAULT_CHAIN_ID;

      config.emitter.emit('connect', { accounts, chainId: currentChainId });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return { accounts, chainId: currentChainId } as any;
    },

    async disconnect() {
      provider = null;
      xoAlias = null;
      currentChainId = DEFAULT_CHAIN_ID;
      config.emitter.emit('disconnect');
    },

    async getAccounts() {
      if (!provider) return [];
      const raw = (await provider.request({
        method: 'eth_accounts',
      })) as Address[];
      if (raw.length > 0) return raw;
      const client = await provider.getClient();
      const evmAddr = getEvmAddress(client);
      return evmAddr ? [evmAddr] : [];
    },

    async getChainId() {
      return currentChainId;
    },

    async switchChain({ chainId }: { chainId: number }) {
      // XO wallet doesn't natively support chain switching,
      // so we track it locally and let wagmi handle the RPC routing
      const chainCfg = CHAIN_CONFIGS[chainId];
      if (!chainCfg) throw new Error(`Unsupported chain: ${chainId}`);

      currentChainId = chainId;

      // Try to ask the provider to switch (may not be supported)
      if (provider) {
        try {
          await provider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${chainId.toString(16)}` }],
          });
        } catch {
          // Provider doesn't support switching — that's OK,
          // wagmi will route RPCs through the configured transport
        }
      }

      config.emitter.emit('change', { chainId });

      return chainCfg.chain;
    },

    async getProvider() {
      return provider;
    },

    async isAuthorized() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return typeof window !== 'undefined' && !!(window as any).XOConnect;
    },

    onAccountsChanged(accounts) {
      if (accounts.length === 0) {
        config.emitter.emit('disconnect');
      } else {
        config.emitter.emit('change', {
          accounts: accounts as Address[],
        });
      }
    },

    onChainChanged(chainId) {
      currentChainId = Number(chainId);
      config.emitter.emit('change', {
        chainId: currentChainId,
      });
    },

    onDisconnect() {
      config.emitter.emit('disconnect');
    },
  }));
}
