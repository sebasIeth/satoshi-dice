import { createConnector } from 'wagmi';
import { XOConnectProvider } from 'xo-connect';
import type { Address } from 'viem';
import { activeChain, RPC_URL } from '../config';

const isMainnet = import.meta.env.VITE_NETWORK === 'mainnet';
const CHAIN_ID_HEX = isMainnet ? '0x2105' : '0x14a34'; // 8453 or 84532

let xoAlias: string | null = null;
let xoDebugInfo: string = '';

export function getXOAlias(): string | null {
  return xoAlias;
}

export function getXODebug(): string {
  return xoDebugInfo;
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
        debug: import.meta.env.DEV,
        defaultChainId: CHAIN_ID_HEX,
        rpcs: { [CHAIN_ID_HEX]: RPC_URL },
      });

      const rawAccounts = await provider.request({
        method: 'eth_requestAccounts',
      });
      console.warn('[XO DEBUG] raw accounts:', JSON.stringify(rawAccounts));

      const accounts = (Array.isArray(rawAccounts) ? rawAccounts : [rawAccounts]).filter(Boolean) as Address[];
      console.warn('[XO DEBUG] parsed accounts:', JSON.stringify(accounts));

      const client = await provider.getClient();
      xoAlias = client?.alias || null;
      console.warn('[XO DEBUG] alias:', xoAlias, 'client keys:', client ? Object.keys(client) : 'null');
      xoDebugInfo = `raw:${JSON.stringify(rawAccounts)} | parsed:${JSON.stringify(accounts)} | alias:${xoAlias}`;

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
