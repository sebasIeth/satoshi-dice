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
}

export interface BetRecord extends BetPayload {
  _id: string;
  createdAt: string;
}

export async function saveBet(bet: BetPayload): Promise<void> {
  try {
    await fetch(`${API_BASE}/bets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bet),
    });
  } catch (err) {
    console.error('Failed to save bet:', err);
  }
}

export interface RelayParams {
  player: string;
  target: number;
  isUnder: boolean;
  amount: string; // bigint as string
  deadline: number;
  v: number;
  r: string;
  s: string;
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
        const errorMsg = data.error || `Relay failed (${res.status})`;
        // Only retry on 500+ server errors, not 4xx client errors
        if (res.status >= 500 && attempt < maxRetries) {
          await new Promise(r => setTimeout(r, 500 * 2 ** attempt));
          continue;
        }
        throw new Error(errorMsg);
      }
      return res.json();
    } catch (err: any) {
      // Retry on network failures (fetch throws on network errors)
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

export async function fetchBets(limit = 50, player?: string): Promise<BetRecord[]> {
  try {
    const params = new URLSearchParams({ limit: String(limit) });
    if (player) params.set('player', player);
    const res = await fetch(`${API_BASE}/bets?${params}`);
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.error('Failed to fetch bets:', err);
    return [];
  }
}
