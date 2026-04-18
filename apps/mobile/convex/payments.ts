import { v } from 'convex/values';
import { mutation, query, internalQuery, internalMutation, action } from './_generated/server';

export const getByUser = query({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    return await (ctx as any).db
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
    return await (ctx as any).db.insert('payments', {
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
    return await (ctx as any).db
      .query('payments')
      .withIndex('by_gateway_order', (q) =>
        q.eq('gatewayOrderId', args.gatewayOrderId)
      )
      .first();
  },
});

export const getByMidtransOrder = internalQuery({
  args: { gatewayOrderId: v.string() },
  handler: async (ctx, args) => {
    return await (ctx as any).db
      .query('payments')
      .withIndex('by_gateway_order', (q) =>
        q.eq('gatewayOrderId', args.gatewayOrderId)
      )
      .first();
  },
});

export const updateStatus = internalMutation({
  args: {
    gatewayOrderId: v.string(),
    status: v.union(
      v.literal('pending'),
      v.literal('success'),
      v.literal('failed')
    ),
  },
  handler: async (ctx, args) => {
    const payment = await (ctx as any).db
      .query('payments')
      .withIndex('by_gateway_order', (q) =>
        q.eq('gatewayOrderId', args.gatewayOrderId)
      )
      .first();

    if (!payment) throw new Error('Payment not found');

    await (ctx as any).db.patch(payment._id, {
      status: args.status,
      paidAt: args.status === 'success' ? Date.now() : undefined,
    });

    return payment._id;
  },
});

const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY || '';
const MIDTRANS_BASE_URL = 'https://app.sandbox.midtrans.com';

function base64Encode(str: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';
  const bytes = new TextEncoder().encode(str);
  for (let i = 0; i < bytes.length; i += 3) {
    const b1 = bytes[i], b2 = bytes[i + 1] ?? 0, b3 = bytes[i + 2] ?? 0;
    result += chars[b1 >> 2] + chars[((b1 & 3) << 4) | (b2 >> 4)] + (i + 1 < bytes.length ? chars[((b2 & 15) << 2) | (b3 >> 6)] : '=') + (i + 2 < bytes.length ? chars[b3 & 63] : '=');
  }
  return result;
}

function getMidtransAuth(): string {
  return base64Encode(MIDTRANS_SERVER_KEY + ':');
}

export const createPaymentOrder = action({
  args: {
    userId: v.id('users'),
    courseId: v.id('courses'),
  },
  handler: async (ctx, args) => {
    const user = await (ctx as any).db.get(args.userId);
    if (!user) throw new Error('User not found');

    const course = await (ctx as any).db.get(args.courseId);
    if (!course) throw new Error('Course not found');
    if (course.type !== 'premium') throw new Error('Course is not premium');

    const existingEnrollment = await (ctx as any).db
      .query('enrollments')
      .withIndex('by_user_course', (q) =>
        q.eq('userId', args.userId).eq('courseId', args.courseId)
      )
      .first();

    if (existingEnrollment) throw new Error('User already enrolled in this course');

    const timestamp = Date.now();
    const orderId = `NEXA-${args.courseId}-${timestamp}`;

    const midtransBody = {
      transaction_details: {
        order_id: orderId,
        gross_amount: course.price,
      },
      customer_details: {
        first_name: user.name || 'Customer',
        email: user.email,
      },
      item_details: [
        {
          id: args.courseId,
          price: course.price,
          quantity: 1,
          name: course.title,
        },
      ],
    };

    const response = await fetch(`${MIDTRANS_BASE_URL}/snap/v1/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${getMidtransAuth()}`,
      },
      body: JSON.stringify(midtransBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Midtrans API error: ${errorText}`);
    }

    const responseData = await response.json();
    const snapToken = responseData.token;
    const redirectUrl = responseData.redirect_url;

    await (ctx as any).db.insert('payments', {
      userId: args.userId,
      courseId: args.courseId,
      amount: course.price,
      status: 'pending',
      gatewayOrderId: orderId,
      createdAt: Date.now(),
    });

    return {
      snapToken,
      orderId,
      redirectUrl,
    };
  },
});

export const getPaymentStatus = action({
  args: {
    orderId: v.string(),
  },
  handler: async (ctx, args) => {
    const response = await fetch(
      `${MIDTRANS_BASE_URL}/v2/${args.orderId}/status`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${getMidtransAuth()}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to get payment status from Midtrans');
    }

    const data = await response.json();
    return {
      status: data.transaction_status,
      amount: data.gross_amount,
      paymentType: data.payment_type,
    };
  },
});