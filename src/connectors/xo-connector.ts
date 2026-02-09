import { createConnector } from 'wagmi';
import { XOConnectProvider } from 'xo-connect';
import { baseSepolia } from 'wagmi/chains';
import type { Address } from 'viem';

const CHAIN_ID_HEX = '0x14a34';
const RPC_URL = 'https://sepolia.base.org';

export function isXOAvailable(): boolean {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return typeof window !== 'undefined' && !!(window as any).XOConnect;
}

export function xoConnector() {
  let provider: XOConnectProvider | null = null;

  return createConnector((config) => ({
    id: 'xo-connect',
    name: 'XO Wallet',
    type: 'xo-connect',

    async connect(parameters?: { chainId?: number; isReconnecting?: boolean }) {
      void parameters;

      provider = new XOConnectProvider({
        defaultChainId: CHAIN_ID_HEX,
        rpcs: { [CHAIN_ID_HEX]: RPC_URL },
      });

      const accounts = (await provider.request({
        method: 'eth_requestAccounts',
      })) as readonly Address[];

      const chainId = baseSepolia.id;

      config.emitter.emit('connect', { accounts, chainId });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return { accounts, chainId } as any;
    },

    async disconnect() {
      provider = null;
      config.emitter.emit('disconnect');
    },

    async getAccounts() {
      if (!provider) return [];
      const accounts = (await provider.request({
        method: 'eth_accounts',
      })) as Address[];
      return accounts;
    },

    async getChainId() {
      return baseSepolia.id;
    },

    async getProvider() {
      return provider;
    },

    async isAuthorized() {
      return isXOAvailable();
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
      config.emitter.emit('change', {
        chainId: Number(chainId),
      });
    },

    onDisconnect() {
      config.emitter.emit('disconnect');
    },
  }));
}
