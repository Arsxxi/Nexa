import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('courses').collect();
  },
});

export const getById = query({
  args: { id: v.id('courses') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getPremium = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query('courses')
      .withIndex('by_premium', (q) => q.eq('isPremium', true))
      .collect();
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    thumbnail: v.string(),
    instructor: v.string(),
    isPremium: v.boolean(),
    price: v.number(),
    lessonIds: v.array(v.id('lessons')),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('courses', args);
  },
});
