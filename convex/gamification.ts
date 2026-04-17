import { v } from 'convex/values';
import { mutation, query, internalMutation } from './_generated/server';
import { COIN_RULES } from './constants/coinRules';

const BADGES = [
  { id: 'pemula', name: 'Pemula', icon: '🎯', description: 'Selesaikan 1 course' },
  { id: 'on_fire', name: 'On Fire', icon: '🔥', description: 'Streak 7 hari' },
  { id: 'premium', name: 'Premium', icon: '💎', description: 'Beli 1 premium course' },
  { id: 'master', name: 'Master', icon: '🏆', description: 'Selesaikan 5 course' },
  { id: 'earner', name: 'Earner', icon: '💰', description: 'Total earn lifetime >= 10.000 coin' },
];

export const addXP = mutation({
  args: {
    userId: v.id('users'),
    amount: v.number(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error('User not found');

    const newXP = user.xp + args.amount;
    await ctx.db.patch(args.userId, { xp: newXP });

    return { xp: newXP };
  },
});

export const earnStreakBonus = mutation({
  args: { userId: v.id('users') },
  returns: v.number(),
  handler: async (ctx, args) => {
    const bonus = 100;
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error('User not found');

    const newBalance = user.coinBalance + bonus;
    await ctx.db.patch(args.userId, { coinBalance: newBalance });

    await ctx.db.insert('coinTransactions', {
      userId: args.userId,
      amount: bonus,
      type: 'streak_bonus',
      isExpired: false,
      note: 'Bonus streak 7 hari berturut-turut! 🔥',
      createdAt: Date.now(),
    });

    return newBalance;
  },
});

export const earnCoin = internalMutation({
  args: {
    userId: v.id('users'),
    courseId: v.id('courses'),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error('User not found');

    const enrollment = await ctx.db
      .query('enrollments')
      .withIndex('by_user_course', (q) =>
        q.eq('userId', args.userId).eq('courseId', args.courseId)
      )
      .first();

    if (!enrollment) throw new Error('Enrollment not found');
    if (enrollment.coinRewarded) throw new Error('Coin already rewarded for this course');

    const course = await ctx.db.get(args.courseId);
    if (!course) throw new Error('Course not found');

    const coinReward = course.coinReward || COIN_RULES.FREE_COURSE_REWARD;
    const newBalance = user.coinBalance + coinReward;
    await ctx.db.patch(args.userId, { coinBalance: newBalance });

    const expiresAt = Date.now() + COIN_RULES.COIN_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

    await ctx.db.insert('coinTransactions', {
      userId: args.userId,
      amount: coinReward,
      type: 'course_complete',
      courseId: args.courseId,
      expiresAt,
      isExpired: false,
      note: `Menyelesaikan course: ${course.title}`,
      createdAt: Date.now(),
    });

    await ctx.db.patch(enrollment._id, { coinRewarded: true });

    return newBalance;
  },
});

export const getUserBadges = query({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return [];

    const completedCourses = await ctx.db
      .query('enrollments')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .filter((q) => q.exists(q.field('completedAt')))
      .collect();

    const premiumPurchases = await ctx.db
      .query('payments')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .filter((q) => q.eq(q.field('status'), 'success'))
      .collect();

    const earnedCoinLifetime = await ctx.db
      .query('coinTransactions')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .collect();

    const totalEarned = earnedCoinLifetime
      .filter((t) => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);

    const results = [];
    for (const badge of BADGES) {
      let isEarned = false;
      let progress = 0;

      switch (badge.id) {
        case 'pemula':
          isEarned = completedCourses.length >= 1;
          progress = Math.min(100, completedCourses.length * 100);
          break;
        case 'on_fire':
          isEarned = user.streak >= 7;
          progress = Math.min(100, (user.streak / 7) * 100);
          break;
        case 'premium':
          isEarned = premiumPurchases.length >= 1;
          progress = Math.min(100, premiumPurchases.length * 100);
          break;
        case 'master':
          isEarned = completedCourses.length >= 5;
          progress = Math.min(100, (completedCourses.length / 5) * 100);
          break;
        case 'earner':
          isEarned = totalEarned >= 10000;
          progress = Math.min(100, (totalEarned / 10000) * 100);
          break;
      }

      results.push({
        ...badge,
        isEarned,
        progress,
      });
    }

    return results;
  },
});