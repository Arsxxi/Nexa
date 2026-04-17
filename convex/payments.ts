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
    gatewayOrderId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('payments', {
      userId: args.userId,
      courseId: args.courseId,
      amount: args.amount,
      status: 'pending',
      gatewayOrderId: args.gatewayOrderId,
      createdAt: Date.now(),
    });
  },
});

export const getPaymentByOrder = query({
  args: { gatewayOrderId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('payments')
      .withIndex('by_gateway_order', (q) =>
        q.eq('gatewayOrderId', args.gatewayOrderId)
      )
      .first();
  },
});

export const updateStatus = mutation({
  args: {
    gatewayOrderId: v.string(),
    status: v.union(
      v.literal('pending'),
      v.literal('success'),
      v.literal('failed')
    ),
  },
  handler: async (ctx, args) => {
    const payment = await ctx.db
      .query('payments')
      .withIndex('by_gateway_order', (q) =>
        q.eq('gatewayOrderId', args.gatewayOrderId)
      )
      .first();

    if (!payment) throw new Error('Payment not found');

    await ctx.db.patch(payment._id, {
      status: args.status,
      paidAt: args.status === 'success' ? Date.now() : undefined,
    });

    return payment._id;
  },
});