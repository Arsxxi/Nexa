import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

export const getBalance = query({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    const transactions = await ctx.db
      .query('coins')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .collect();

    const balance = transactions.reduce((acc, tx) => {
      return tx.type === 'earn' ? acc + tx.amount : acc - tx.amount;
    }, 0);

    return balance;
  },
});

export const getTransactions = query({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('coins')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .order('desc')
      .take(50);
  },
});

export const addCoins = mutation({
  args: {
    userId: v.id('users'),
    amount: v.number(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('coins', {
      userId: args.userId,
      amount: args.amount,
      type: 'earn',
      reason: args.reason,
      createdAt: Date.now(),
    });
  },
});

export const spendCoins = mutation({
  args: {
    userId: v.id('users'),
    amount: v.number(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('coins', {
      userId: args.userId,
      amount: args.amount,
      type: 'spend',
      reason: args.reason,
      createdAt: Date.now(),
    });
  },
});
