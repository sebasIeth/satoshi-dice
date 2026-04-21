import { createConnector } from 'wagmi';
import { XOConnectProvider } from 'xo-connect';
import type { Address } from 'viem';
import { activeChain, RPC_URL } from '../config';

const isMainnet = import.meta.env.VITE_NETWORK === 'mainnet';
const CHAIN_ID_HEX = isMainnet ? '0x2105' : '0x14a34'; // 8453 or 84532

let xoAlias: string | null = null;

export function getXOAlias(): string | null {
  return xoAlias;
}

function getEvmAddress(client: any): Address | null {
  if (!client?.currencies) return null;
  // Look for an EVM currency (0x-prefixed address) — prefer ETH chain
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

      provider = new XOConnectProvider({
        debug: import.meta.env.DEV,
        defaultChainId: CHAIN_ID_HEX,
        rpcs: { [CHAIN_ID_HEX]: RPC_URL },
      });

      // Try standard EIP-1102 first
      const rawAccounts = await provider.request({
        method: 'eth_requestAccounts',
      });
      let accounts = (Array.isArray(rawAccounts) ? rawAccounts : [rawAccounts]).filter(Boolean) as Address[];

      const client = await provider.getClient();
      xoAlias = client?.alias || null;

      // Fallback: extract EVM address from client currencies if eth_requestAccounts returned empty
      if (accounts.length === 0) {
        const evmAddr = getEvmAddress(client);
        if (evmAddr) accounts = [evmAddr];
      }

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
      const raw = (await provider.request({
        method: 'eth_accounts',
      })) as Address[];
      if (raw.length > 0) return raw;
      // Fallback: extract from client
      const client = await provider.getClient();
      const evmAddr = getEvmAddress(client);
      return evmAddr ? [evmAddr] : [];
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
