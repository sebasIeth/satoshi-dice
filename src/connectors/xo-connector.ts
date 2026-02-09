import { createConnector } from 'wagmi';
import { XOConnectProvider } from 'xo-connect';
import type { Address } from 'viem';
import { activeChain } from '../config';

const isMainnet = import.meta.env.VITE_NETWORK === 'mainnet';
const CHAIN_ID_HEX = isMainnet ? '0x2105' : '0x14a34'; // 8453 or 84532
const RPC_URL = isMainnet ? 'https://mainnet.base.org' : 'https://sepolia.base.org';

let xoAlias: string | null = null;

export function getXOAlias(): string | null {
  return xoAlias;
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

      const client = await provider.getClient();
      xoAlias = client?.alias || null;

      const chainId = activeChain.id;

      config.emitter.emit('connect', { accounts, chainId });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return { accounts, chainId } as any;
    },

    async disconnect() {
      provider = null;
      xoAlias = null;
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
      return activeChain.id;
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
      config.emitter.emit('change', {
        chainId: Number(chainId),
      });
    },

    onDisconnect() {
      config.emitter.emit('disconnect');
    },
  }));
}
