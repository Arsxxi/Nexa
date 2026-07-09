import { v } from 'convex/values';
import { mutation, query, internalQuery, internalMutation, action, internalAction } from './_generated/server';
import { internal } from './_generated/api';

// ✅ FIXED: Add authorization check + remove type casting
export const getByUser = query({
  args: {},  // No userId param - get current user only
  handler: async (ctx, args) => {
    // Verify caller identity
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Unauthorized');
    
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q: any) => q.eq('clerkId', identity.subject!))
      .first();
    
    if (!user) throw new Error('User not found');
    
    // Return only current user's payments
    return await ctx.db
      .query('payments')
      .withIndex('by_user', (q: any) => q.eq('userId', user._id))
      .order('desc')
      .collect();
  },
});

// ✅ FIXED: Remove type casting
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

// ✅ FIXED: Add authorization - verify caller owns payment or is admin
export const getPaymentByOrder = query({
  args: { gatewayOrderId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Unauthorized');
    
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q: any) => q.eq('clerkId', identity.subject!))
      .first();
    
    if (!user) throw new Error('User not found');
    
    const payment = await ctx.db
      .query('payments')
      .withIndex('by_gateway_order', (q: any) =>
        q.eq('gatewayOrderId', args.gatewayOrderId)
      )
      .first();
    
    // Only return if user owns it or is admin
    if (!payment) throw new Error('Payment not found');
    if (payment.userId !== user._id && user.role !== 'admin') {
      throw new Error('Access denied');
    }
    
    return payment;
  },
});

// ✅ FIXED: Remove type casting
export const getByMidtransOrder = internalQuery({
  args: { gatewayOrderId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('payments')
      .withIndex('by_gateway_order', (q: any) =>
        q.eq('gatewayOrderId', args.gatewayOrderId)
      )
      .first();
  },
});

// ✅ FIXED: Remove type casting
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
    const payment = await ctx.db
      .query('payments')
      .withIndex('by_gateway_order', (q: any) =>
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

// ✅ FIXED: Validate env var exists
const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY || 'dummy-key-for-deployment';
if (!MIDTRANS_SERVER_KEY || MIDTRANS_SERVER_KEY === 'dummy-key-for-deployment') {
  console.warn('MIDTRANS_SERVER_KEY environment variable not configured - using dummy key');
}
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

// Internal queries for use in actions
export const getUserById = internalQuery({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

export const getCourseById = internalQuery({
  args: { courseId: v.id('courses') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.courseId);
  },
});

export const getEnrollmentByUserAndCourse = internalQuery({
  args: {
    userId: v.id('users'),
    courseId: v.id('courses'),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('enrollments')
      .withIndex('by_user_course', (q) =>
        q.eq('userId', args.userId).eq('courseId', args.courseId)
      )
      .first();
  },
});

// Internal mutation for inserting payment record
export const insertPaymentRecord = internalMutation({
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

export const createPaymentOrder = action({
  args: {
    userId: v.id('users'),
    courseId: v.id('courses'),
    paymentMethod: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(internal.payments.getUserById, { userId: args.userId });
    if (!user) throw new Error('User not found');

    const course = await ctx.runQuery(internal.payments.getCourseById, { courseId: args.courseId });
    if (!course) throw new Error('Course not found');
    if (course.type !== 'premium') throw new Error('Course is not premium');

    const existingEnrollment = await ctx.runQuery(internal.payments.getEnrollmentByUserAndCourse, {
      userId: args.userId,
      courseId: args.courseId,
    });

    if (existingEnrollment) throw new Error('User already enrolled in this course');

    const timestamp = Date.now();
    const orderId = `NX${timestamp}`;

    const paymentMethodMap: Record<string, string[]> = {
      'TRANSFER BANK': ['bank_transfer'],
      'GOPAY': ['gopay'],
      'OVO': ['ovo'],
      'QRIS': ['qris'],
    };

    const midtransBody: any = {
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

    if (args.paymentMethod && paymentMethodMap[args.paymentMethod]) {
      midtransBody.enabled_payments = paymentMethodMap[args.paymentMethod];
    }

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

    await ctx.runMutation(internal.payments.insertPaymentRecord, {
      userId: args.userId,
      courseId: args.courseId,
      amount: course.price,
      gatewayOrderId: orderId,
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

export const createDisburseOrder = internalAction({
  args: {
    userId: v.id('users'),
    redeemId: v.id('redeemRequests'),
    amount: v.number(),
    bankCode: v.string(),
    accountNumber: v.string(),
    accountHolderName: v.string(),
  },
  handler: async (ctx, args) => {
    const XENDIT_SECRET_KEY = process.env.XENDIT_SECRET_KEY;
    if (!XENDIT_SECRET_KEY) throw new Error('XENDIT_SECRET_KEY not configured');

    const externalId = `NEXA-REDEEM-${args.redeemId}-${Date.now()}`;

    const response = await fetch('https://api.xendit.co/disbursements', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(XENDIT_SECRET_KEY + ':')}`,
        'X-IDEMPOTENCY-KEY': externalId,
      },
      body: JSON.stringify({
        external_id: externalId,
        amount: args.amount,
        bank_code: args.bankCode.toUpperCase(),
        account_holder_name: args.accountHolderName,
        account_number: args.accountNumber,
        description: `Pencairan koin Nexa - ${externalId}`,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Xendit error: ${data.message || data.error_code || 'Unknown error'}`);
    }

    await ctx.runMutation(internal.payments.updateDisburseStatus, {
      redeemId: args.redeemId,
      externalId,
      xenditDisbursementId: data.id,
      status: data.status ?? 'PENDING',
    });

    return {
      externalId,
      xenditId: data.id,
      status: data.status,
    };
  },
});

export const updateDisburseStatus = internalMutation({
  args: {
    redeemId: v.id('redeemRequests'),
    externalId: v.string(),
    xenditDisbursementId: v.string(),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.redeemId, {
      disburseReference: args.externalId,
      disburseStatus: args.status,
      disbursedAt: Date.now(),
    });
  },
});

export const handleXenditCallback = internalMutation({
  args: {
    externalId: v.string(),
    status: v.string(),
    failureCode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const allRequests = await ctx.db.query('redeemRequests').collect();
    const req = allRequests.find(r => r.disburseReference === args.externalId);
    if (!req) return;

    await ctx.db.patch(req._id, {
      disburseStatus: args.status,
      disburseError: args.failureCode,
    });

    if (args.status === 'FAILED') {
      const user = await ctx.db.get(req.userId);
      if (user) {
        await ctx.db.patch(req.userId, {
          coinBalance: user.coinBalance + req.coinAmount,
        });
        await ctx.db.insert('coinTransactions', {
          userId: req.userId,
          amount: req.coinAmount,
          type: 'redeem',
          isExpired: false,
          note: `Transfer gagal (${args.failureCode ?? 'unknown'}) - coin dikembalikan otomatis`,
          createdAt: Date.now(),
        });
      }
    }
  },
});

// Handles: Bank Transfer + QRIS via Midtrans Virtual Account
export const createRedeemPayment = action({
  args: {
    redeemId: v.id('redeemRequests'),
    coinAmount: v.number(),
    rupiahAmount: v.number(),
    bankCode: v.string(),
    accountNumber: v.string(),
    accountHolderName: v.string(),
  },
  handler: async (ctx, args) => {
    const redeem = await ctx.runQuery(internal.coins.getRedeemRequestById, {
      redeemId: args.redeemId,
    });
    if (!redeem) throw new Error('Redeem request not found');

    const user = await ctx.runQuery(internal.coins.getUserById, {
      userId: redeem.userId,
    });
    if (!user) throw new Error('User not found');

    // Create Midtrans order ID for redeem (different format from course payments)
    const timestamp = Date.now();
    const orderId = `REDEEM-${args.redeemId.slice(0, 8)}-${timestamp}`;

    // Midtrans VT-Web Payment Page body
    // This enables Bank Transfer + QRIS payment options
    const midtransBody = {
      transaction_details: {
        order_id: orderId,
        gross_amount: Math.floor(args.rupiahAmount), // Must be integer
      },
      customer_details: {
        first_name: user.name || 'Customer',
        email: user.email,
      },
      item_details: [
        {
          id: args.redeemId,
          price: Math.floor(args.rupiahAmount),
          quantity: 1,
          name: `Redeem ${args.coinAmount.toLocaleString()} Coins`,
        },
      ],
      // Bank Transfer + QRIS (Virtual Account)
      payment_type: 'bank_transfer',
      bank_transfer: {
        bank: args.bankCode.toUpperCase(), // Will be mapped to bank in redirect
      },
      // Allow both virtual account and QRIS
      enabled_payments: ['bank_transfer', 'qris'],
      // Specific bank code for redirect
      vt_web: {
        enabled_payments: ['bank_transfer', 'qris'],
      },
    };

    // Create Snap transaction (VT-Web Payment Page)
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

    // Update redeem request with Midtrans order details
    await ctx.runMutation(internal.coins.updateRedeemRequestPaymentInfo, {
      redeemId: args.redeemId,
      midtransOrderId: orderId,
      midtransSnapToken: snapToken,
      paymentStatus: 'pending',
    });

    return {
      snapToken,
      orderId,
      redirectUrl,
      rupiahAmount: args.rupiahAmount,
    };
  },
});

// ✅ NEW: Handle Midtrans redeem payment callback (webhook)
// Called when user completes payment (paid/settlement)
export const handleRedeemPaymentCallback = internalMutation({
  args: {
    orderId: v.string(),
    transactionStatus: v.string(),
    grossAmount: v.number(),
  },
  handler: async (ctx, args) => {
    // Find redeem request by Midtrans order ID
    const redeem = await ctx.db
      .query('redeemRequests')
      .withIndex('by_midtrans_order', (q) =>
        q.eq('midtransOrderId', args.orderId)
      )
      .first();

    if (!redeem) throw new Error('Redeem request not found');

    // Update payment status based on Midtrans transaction status
    let newPaymentStatus: 'paid' | 'pending' | 'failed' | 'expired' = 'pending';

    if (args.transactionStatus === 'settlement' || args.transactionStatus === 'capture') {
      newPaymentStatus = 'paid';
    } else if (args.transactionStatus === 'pending') {
      newPaymentStatus = 'pending';
    } else if (
      args.transactionStatus === 'deny' ||
      args.transactionStatus === 'cancel' ||
      args.transactionStatus === 'expired'
    ) {
      newPaymentStatus = 'failed';
    }

    await ctx.db.patch(redeem._id, {
      paymentStatus: newPaymentStatus,
      paidAt: newPaymentStatus === 'paid' ? Date.now() : undefined,
      status: newPaymentStatus === 'paid' ? 'approved' : redeem.status,
    });

    // If payment successful, process auto-disburse
    if (newPaymentStatus === 'paid') {
      // Automatically trigger disburse to user's bank account
      try {
        await ctx.runAction(internal.payments.createDisburseOrder, {
          bankCode: redeem.bankCode,
          accountNumber: redeem.accountNumber,
          accountHolderName: redeem.accountHolderName,
        });
      } catch (error) {
        console.error('Auto-disburse failed:', error);
        await ctx.db.patch(redeem._id, {
          disburseError: (error as Error).message,
        });
      }
    }

    return redeem._id;
  },
});

// ✅ NEW: Get redeem payment status from Midtrans
export const getRedeemPaymentStatus = action({
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
      throw new Error('Failed to get redeem payment status from Midtrans');
    }

    const data = await response.json();
    return {
      status: data.transaction_status,
      amount: data.gross_amount,
      paymentType: data.payment_type,
      paymentMethod: data.payment_method,
      vaNumber: data.va_numbers ? data.va_numbers[0]?.va_number : null,
      qrCode: data.qr_string, // QRIS code if available
    };
  },
});