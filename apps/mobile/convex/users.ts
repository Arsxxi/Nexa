import { v } from 'convex/values';
import { mutation, query, internalMutation } from './_generated/server';
import { internal } from './_generated/api';

export const createUser = mutation({
  args: {
    clerkId: v.string(),
    name: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', args.clerkId))
      .first();

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert('users', {
      clerkId: args.clerkId,
      name: args.name,
      email: args.email,
      coinBalance: 0,
      xp: 0,
      streak: 0,
      role: 'user',
    });
  },
});

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject!))
      .first();

    return user;
  },
});

export const getTopUsers = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const all = await ctx.db.query('users').collect();
    const sorted = all.sort((a, b) => b.xp - a.xp).slice(0, args.limit || 10);

    return sorted.map((u) => ({
      _id: u._id,
      name: u.name,
      xp: u.xp,
      streak: u.streak,
    }));
  },
});

export const updateStreak = mutation({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error('User not found');

    const today = new Date().toISOString().split('T')[0];
    const lastActive = user.lastActiveDate;

    let newStreak = user.streak || 0;

    if (lastActive) {
      const lastDate = new Date(lastActive);
      const todayDate = new Date(today);
      const diffDays = Math.floor(
        (todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays === 1) {
        newStreak += 1;
      } else if (diffDays > 1) {
        newStreak = 1;
      }
    } else {
      newStreak = 1;
    }

    await ctx.db.patch(args.userId, {
      streak: newStreak,
      lastActiveDate: today,
    });

    if (newStreak > 0 && newStreak % 7 === 0) {
      await ctx.runMutation(internal.gamification.earnStreakBonus, { userId: args.userId });
    }

    return newStreak;
  },
});

export const resetStaleStreaks = internalMutation({
  handler: async (ctx) => {
    const all = await ctx.db.query('users').collect();
    const today = new Date().toISOString().split('T')[0];
    for (const u of all) {
      if (u.lastActiveDate && u.lastActiveDate !== today) {
        const last = new Date(u.lastActiveDate);
        const todayDate = new Date(today);
        const diffDays = Math.floor(
          (todayDate.getTime() - last.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (diffDays > 1) {
          await ctx.db.patch(u._id, { streak: 0, lastActiveDate: today });
        }
      }
    }
  },
});

export const resetWeeklyLeaderboard = internalMutation({
  handler: async (ctx) => {
    const all = await ctx.db.query('users').collect();
    for (const u of all) {
      await ctx.db.patch(u._id, { xp: 0 });
    }
  },
});

export const expireOldCoins = internalMutation({
  handler: async (ctx) => {
    const now = Date.now();
    const expired = await ctx.db
      .query('coinTransactions')
      .withIndex('by_expires', (q) => q.lt('expiresAt', now))
      .filter((q) => q.eq(q.field('isExpired'), false))
      .collect();

    const userMap = new Map<any, number>();

    for (const tx of expired) {
      if (tx.amount > 0) {
        const current = userMap.get(tx.userId) || 0;
        userMap.set(tx.userId, current + tx.amount);
      }
      await ctx.db.patch(tx._id, { isExpired: true });
    }

    for (const [userId, expiringAmount] of userMap) {
      const user = await ctx.db.get(userId as any) as any;
      if (!user) continue;

      const newBalance = Math.max(0, user.coinBalance - expiringAmount);
      await ctx.db.patch(userId as any, { coinBalance: newBalance });

      await ctx.db.insert('coinTransactions', {
        userId,
        amount: -expiringAmount,
        type: 'expired',
        isExpired: false,
        note: 'Expired coins',
        createdAt: Date.now(),
      });
    }
  },
});