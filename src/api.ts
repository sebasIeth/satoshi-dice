import type { ChainKey } from './chains';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export interface BetPayload {
  player: string;
  amount: number;
  result: number;
  target: number;
  direction: 'under' | 'over';
  isWin: boolean;
  payout: number;
  txHash: string;
  chain: ChainKey;
}

export interface BetRecord extends BetPayload {
  _id: string;
  createdAt: string;
}

export async function saveBet(bet: BetPayload): Promise<void> {
  const res = await fetch(`${API_BASE}/bets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bet),
  });
  if (!res.ok && res.status !== 409) {
    throw new Error(`Save bet failed (${res.status})`);
  }
}

export interface RelayParams {
  player: string;
  target: number;
  isUnder: boolean;
  amount: string;
  deadline: number;
  v: number;
  r: string;
  s: string;
  chain: ChainKey;
}

export async function relayRoll(params: RelayParams): Promise<{ txHash: string }> {
  const maxRetries = 3;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(`${API_BASE}/relay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const details = data.details ? ` | ${JSON.stringify(data.details)}` : '';
        const errorMsg = (data.error || `Relay failed (${res.status})`) + details;
        if (res.status >= 500 && attempt < maxRetries) {
          await new Promise(r => setTimeout(r, 500 * 2 ** attempt));
          continue;
        }
        throw new Error(errorMsg);
      }
      return res.json();
    } catch (err: any) {
      if (err.name !== 'Error' || !err.message?.startsWith('Relay failed')) {
        if (attempt < maxRetries) {
          await new Promise(r => setTimeout(r, 500 * 2 ** attempt));
          continue;
        }
      }
      throw err;
    }
  }
  throw new Error('Relay failed after retries');
}

export async function fetchBets(limit = 50, player?: string, chain?: ChainKey): Promise<BetRecord[]> {
  try {
    const params = new URLSearchParams({ limit: String(limit) });
    if (player) params.set('player', player);
    if (chain) params.set('chain', chain);
    const res = await fetch(`${API_BASE}/bets?${params}`);
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.error('Failed to fetch bets:', err);
    return [];
  }
}
