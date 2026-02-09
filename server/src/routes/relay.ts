import { Router } from 'express';
import { isAddress } from 'viem';
import {
  publicClient,
  walletClient,
  relayerAccount,
  DICE_GAME_ADDRESS,
  USDC_ADDRESS,
  USDC_ABI,
  DICE_GAME_ABI,
} from '../relayer.js';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const { player, target, isUnder, amount, deadline, v, r, s } = req.body;

    // Validate params
    if (!player || !isAddress(player)) {
      res.status(400).json({ error: 'Invalid player address' });
      return;
    }
    if (typeof target !== 'number' || target < 1 || target > 99) {
      res.status(400).json({ error: 'Target must be between 1 and 99' });
      return;
    }
    if (typeof isUnder !== 'boolean') {
      res.status(400).json({ error: 'isUnder must be a boolean' });
      return;
    }
    if (!amount || typeof amount !== 'string') {
      res.status(400).json({ error: 'amount must be a string (bigint)' });
      return;
    }
    if (typeof deadline !== 'number' || deadline <= Math.floor(Date.now() / 1000)) {
      res.status(400).json({ error: 'deadline must be a future timestamp' });
      return;
    }
    if (v !== 27 && v !== 28) {
      res.status(400).json({ error: 'v must be 27 or 28' });
      return;
    }
    if (typeof r !== 'string' || typeof s !== 'string') {
      res.status(400).json({ error: 'r and s must be hex strings' });
      return;
    }

    const amountBigInt = BigInt(amount);

    // On-chain checks: player balance
    const playerBalance = await publicClient.readContract({
      address: USDC_ADDRESS,
      abi: USDC_ABI,
      functionName: 'balanceOf',
      args: [player as `0x${string}`],
    });

    if (playerBalance < amountBigInt) {
      res.status(400).json({ error: 'Insufficient USDC balance' });
      return;
    }

    // On-chain check: contract liquidity
    const contractBalance = await publicClient.readContract({
      address: USDC_ADDRESS,
      abi: USDC_ABI,
      functionName: 'balanceOf',
      args: [DICE_GAME_ADDRESS],
    });

    // Rough payout check (99x max multiplier)
    const winChance = isUnder ? target : 99 - target;
    const maxPayout = (amountBigInt * 99n) / BigInt(Math.max(1, winChance));
    if (contractBalance < maxPayout) {
      res.status(400).json({ error: 'Insufficient contract liquidity' });
      return;
    }

    // Send rollWithPermit transaction
    const txHash = await walletClient.writeContract({
      address: DICE_GAME_ADDRESS,
      abi: DICE_GAME_ABI,
      functionName: 'rollWithPermit',
      args: [
        player as `0x${string}`,
        target,
        isUnder,
        amountBigInt,
        BigInt(deadline),
        v,
        r as `0x${string}`,
        s as `0x${string}`,
      ],
      account: relayerAccount,
    });

    res.json({ txHash });
  } catch (err: any) {
    console.error('Relay error:', err);
    res.status(500).json({ error: err?.shortMessage || err?.message || 'Relay failed' });
  }
});

export default router;
