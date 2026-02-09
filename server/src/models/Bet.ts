import mongoose from 'mongoose';

const betSchema = new mongoose.Schema(
  {
    player: { type: String, required: true, lowercase: true, index: true },
    amount: { type: Number, required: true },
    result: { type: Number, required: true },
    target: { type: Number, required: true },
    direction: { type: String, required: true, enum: ['under', 'over'] },
    isWin: { type: Boolean, required: true },
    payout: { type: Number, required: true },
    txHash: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

export const Bet = mongoose.model('Bet', betSchema);
