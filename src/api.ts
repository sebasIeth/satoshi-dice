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
