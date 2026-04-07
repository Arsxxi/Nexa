import { v } from 'convex/values';
import { mutation, query, internalMutation } from './_generated/server';

export const get = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', args.clerkId))
      .first();
  },
});

export const createOrUpdate = mutation({
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
      await ctx.db.patch(existing._id, {
        name: args.name,
        email: args.email,
      });
      return existing._id;
    }

    return await ctx.db.insert('users', {
      name: args.name,
      email: args.email,
      clerkId: args.clerkId,
      role: 'user',
      xp: 0,
      streak: 0,
      coins: 0,
      badges: [],
    });
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
