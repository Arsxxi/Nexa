import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

export const getByUser = query({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('payments')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .order('desc')
      .collect();
  },
});

export const create = mutation({
  args: {
    userId: v.id('users'),
    courseId: v.id('courses'),
    amount: v.number(),
    midtransOrderId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('payments', {
      userId: args.userId,
      courseId: args.courseId,
      amount: args.amount,
      status: 'pending',
      midtransOrderId: args.midtransOrderId,
      createdAt: Date.now(),
    });
  },
});

export const updateStatus = mutation({
  args: {
    midtransOrderId: v.string(),
    status: v.union(
      v.literal('pending'),
      v.literal('success'),
      v.literal('failed')
    ),
    midtransTransactionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const payment = await ctx.db
      .query('payments')
      .withIndex('by_midtrans_order', (q) =>
        q.eq('midtransOrderId', args.midtransOrderId)
      )
      .first();

    if (!payment) throw new Error('Payment not found');

    await ctx.db.patch(payment._id, {
      status: args.status,
      midtransTransactionId: args.midtransTransactionId,
      updatedAt: Date.now(),
    });

    return payment._id;
  },
});
