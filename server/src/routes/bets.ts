import { Router } from 'express';
import { Bet } from '../models/Bet.js';

const router = Router();

// POST /api/bets - Save a new bet
router.post('/', async (req, res) => {
  try {
    const { player, amount, result, target, direction, isWin, payout, txHash } = req.body;
    const bet = await Bet.create({ player, amount, result, target, direction, isWin, payout, txHash });
    res.status(201).json(bet);
  } catch (err: any) {
    // Duplicate txHash → 409 Conflict
    if (err.code === 11000) {
      res.status(409).json({ error: 'Bet already recorded' });
      return;
    }
    console.error('Error saving bet:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/bets - List recent bets
router.get('/', async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const filter: any = {};
    if (req.query.player) {
      filter.player = (req.query.player as string).toLowerCase();
    }
    const bets = await Bet.find(filter).sort({ createdAt: -1 }).limit(limit).lean();
    res.json(bets);
  } catch (err) {
    console.error('Error fetching bets:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
