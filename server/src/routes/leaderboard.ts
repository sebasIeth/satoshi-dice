import { Router } from 'express';
import { Bet } from '../models/Bet.js';

const router = Router();

// GET /api/leaderboard - Top players by net profit
router.get('/', async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 10, 50);

    const leaderboard = await Bet.aggregate([
      {
        $group: {
          _id: '$player',
          totalBets: { $sum: 1 },
          wins: { $sum: { $cond: ['$isWin', 1, 0] } },
          losses: { $sum: { $cond: ['$isWin', 0, 1] } },
          totalWon: {
            $sum: { $cond: ['$isWin', '$payout', 0] },
          },
          totalWagered: { $sum: '$amount' },
        },
      },
      {
        $addFields: {
          player: '$_id',
          netProfit: { $subtract: ['$totalWon', '$totalWagered'] },
          winRate: {
            $round: [
              { $multiply: [{ $divide: ['$wins', '$totalBets'] }, 100] },
              1,
            ],
          },
        },
      },
      { $sort: { netProfit: -1 } },
      { $limit: limit },
      { $project: { _id: 0, player: 1, totalBets: 1, wins: 1, losses: 1, totalWon: 1, totalWagered: 1, netProfit: 1, winRate: 1 } },
    ]);

    res.json(leaderboard);
  } catch (err) {
    console.error('Error fetching leaderboard:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
