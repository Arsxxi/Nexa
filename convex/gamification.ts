import { v } from 'convex/values';
import { mutation, query, internalMutation } from './_generated/server';

export const get = query({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('gamification')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .first();
  },
});

export const getLeaderboard = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query('gamification').collect();
    return all.sort((a, b) => b.xp - a.xp).slice(0, 10);
  },
});

export const addXP = mutation({
  args: {
    userId: v.id('users'),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const gamification = await ctx.db
      .query('gamification')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .first();

    if (gamification) {
      const newXP = gamification.xp + args.amount;
      const newLevel = Math.floor(newXP / 100) + 1;

      await ctx.db.patch(gamification._id, {
        xp: newXP,
        level: newLevel,
      });

      return { xp: newXP, level: newLevel };
    }

    const id = await ctx.db.insert('gamification', {
      userId: args.userId,
      xp: args.amount,
      level: 1,
      streak: 0,
      badges: [],
    });

    return { xp: args.amount, level: 1 };
  },
});

export const updateStreak = mutation({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    const gamification = await ctx.db
      .query('gamification')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .first();

    if (!gamification) {
      await ctx.db.insert('gamification', {
        userId: args.userId,
        xp: 0,
        level: 1,
        streak: 1,
        badges: [],
        lastStreakDate: new Date().toISOString().split('T')[0],
      });
      return 1;
    }

    const today = new Date().toISOString().split('T')[0];
    const lastDate = gamification.lastStreakDate;

    let newStreak = gamification.streak;

    if (lastDate) {
      const last = new Date(lastDate);
      const todayDate = new Date(today);
      const diffDays = Math.floor(
        (todayDate.getTime() - last.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays === 1) {
        newStreak += 1;
      } else if (diffDays > 1) {
        newStreak = 1;
      }
    } else {
      newStreak = 1;
    }

    await ctx.db.patch(gamification._id, {
      streak: newStreak,
      lastStreakDate: today,
    });

    return newStreak;
  },
});

export const awardBadge = mutation({
  args: {
    userId: v.id('users'),
    badge: v.string(),
  },
  handler: async (ctx, args) => {
    const gamification = await ctx.db
      .query('gamification')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .first();

    if (!gamification) throw new Error('Gamification profile not found');

    if (!gamification.badges.includes(args.badge)) {
      await ctx.db.patch(gamification._id, {
        badges: [...gamification.badges, args.badge],
      });
    }

    return gamification.badges;
  },
});

export const resetStaleStreaks = internalMutation({
  handler: async (ctx) => {
    const all = await ctx.db.query('gamification').collect();
    const today = new Date().toISOString().split('T')[0];
    for (const g of all) {
      if (g.lastStreakDate && g.lastStreakDate !== today) {
        const last = new Date(g.lastStreakDate);
        const todayDate = new Date(today);
        const diffDays = Math.floor(
          (todayDate.getTime() - last.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (diffDays > 1) {
          await ctx.db.patch(g._id, { streak: 0, lastStreakDate: today });
        }
      }
    }
  },
});

export const resetWeeklyLeaderboard = internalMutation({
  handler: async (ctx) => {
    const all = await ctx.db.query('gamification').collect();
    for (const g of all) {
      await ctx.db.patch(g._id, { xp: 0, level: 1 });
    }
  },
});
