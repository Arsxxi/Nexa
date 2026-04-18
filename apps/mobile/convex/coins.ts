import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { COIN_RULES } from './constants/coinRules';

function assertAdmin(ctx: any) {
  const identity = ctx.auth.getUserIdentity();
  if (!identity) throw new Error('Unauthorized');
  if (identity.role !== 'admin') throw new Error('Admin only');
}

export const getCoinBalance = query({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    return user?.coinBalance || 0;
  },
});

export const getCoinHistory = query({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    const transactions = await ctx.db
      .query('coinTransactions')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .order('desc')
      .collect();

    return transactions;
  },
});

export const getRedeemHistory = query({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('redeemRequests')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .order('desc')
      .collect();
  },
});

export const getAllPendingRedeems = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Unauthorized');

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject!))
      .first();

    if (!user || user.role !== 'admin') throw new Error('Admin only');

    const pending = await ctx.db
      .query('redeemRequests')
      .withIndex('by_status', (q) => q.eq('status', 'pending'))
      .collect();

    const result = [];
    for (const request of pending) {
      const userData = await ctx.db.get(request.userId);
      if (userData) {
        result.push({
          ...request,
          userName: userData.name,
          userEmail: userData.email,
        });
      }
    }

    return result;
  },
});

export const requestRedeem = mutation({
  args: {
    coinAmount: v.number(),
    bankAccount: v.string(),
    bankName: v.string(),
  },
  returns: v.id('redeemRequests'),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Unauthorized');

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject!))
      .first();

    if (!user) throw new Error('User not found');
    const userId = user._id;

    if (user.coinBalance < args.coinAmount) {
      throw new Error('Saldo coin tidak cukup');
    }

    if (args.coinAmount < COIN_RULES.MIN_REDEEM) {
      throw new Error(`Minimum pencairan ${COIN_RULES.MIN_REDEEM.toLocaleString()} coin (Rp ${(COIN_RULES.MIN_REDEEM * COIN_RULES.RATE).toLocaleString()})`);
    }

    if (args.coinAmount > COIN_RULES.MAX_REDEEM) {
      throw new Error(`Maksimum pencairan ${COIN_RULES.MAX_REDEEM.toLocaleString()} coin per request`);
    }

    const pendingRequests = await ctx.db
      .query('redeemRequests')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .filter((q) => q.eq(q.field('status'), 'pending'))
      .collect();

    if (pendingRequests.length > 0) {
      throw new Error('Masih ada request pencairan yang sedang diproses');
    }

    const approvedRequests = await ctx.db
      .query('redeemRequests')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .filter((q) => q.eq(q.field('status'), 'approved'))
      .order('desc')
      .first();

    if (approvedRequests) {
      const cooldownMs = COIN_RULES.REDEEM_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
      const daysSinceApproved = (Date.now() - approvedRequests.processedAt!) / cooldownMs;
      if (daysSinceApproved < 1) {
        throw new Error(`Pencairan berikutnya bisa dilakukan ${COIN_RULES.REDEEM_COOLDOWN_DAYS} hari setelah pencairan terakhir`);
      }
    }

    const rupiahAmount = (args.coinAmount / COIN_RULES.RATE) * 1000;
    const newBalance = user.coinBalance - args.coinAmount;
    await ctx.db.patch(userId, { coinBalance: newBalance });

    const redeemId = await ctx.db.insert('redeemRequests', {
      userId,
      coinAmount: args.coinAmount,
      rupiahAmount,
      bankAccount: args.bankAccount,
      bankName: args.bankName,
      status: 'pending',
      requestedAt: Date.now(),
    });

    await ctx.db.insert('coinTransactions', {
      userId,
      amount: -args.coinAmount,
      type: 'redeem',
      isExpired: false,
      note: `Request redeem: ${args.coinAmount} coin -> Rp ${rupiahAmount.toLocaleString()}`,
      createdAt: Date.now(),
    });

    return redeemId;
  },
});

export const processRedeem = mutation({
  args: {
    redeemId: v.id('redeemRequests'),
    status: v.union(v.literal('approved'), v.literal('rejected')),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Unauthorized');

    const adminUser = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject!))
      .first();

    if (!adminUser || adminUser.role !== 'admin') {
      throw new Error('Admin only');
    }

    const request = await ctx.db.get(args.redeemId);
    if (!request) throw new Error('Redeem request not found');

    await ctx.db.patch(args.redeemId, {
      status: args.status,
      processedAt: Date.now(),
    });

    if (args.status === 'rejected') {
      const user = await ctx.db.get(request.userId);
      if (user) {
        const newBalance = user.coinBalance + request.coinAmount;
        await ctx.db.patch(request.userId, { coinBalance: newBalance });

        await ctx.db.insert('coinTransactions', {
          userId: request.userId,
          amount: request.coinAmount,
          type: 'redeem',
          isExpired: false,
          note: 'Pencairan ditolak - coin dikembalikan',
          createdAt: Date.now(),
        });
      }
    }

    return args.redeemId;
  },
});