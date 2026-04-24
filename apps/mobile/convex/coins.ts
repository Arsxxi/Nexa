import { v } from 'convex/values';
import { mutation, query, internalQuery, internalMutation, action } from './_generated/server';
import { internal } from './_generated/api';
import { COIN_RULES } from './constants/coinRules';

// Helper: Verify caller is admin (check database role, not Clerk identity)
async function verifyAdmin(ctx: any): Promise<any> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error('Unauthorized');
  
  const user = await ctx.db
    .query('users')
    .withIndex('by_clerk_id', (q: any) => q.eq('clerkId', identity.subject!))
    .first();
  
  if (!user || user.role !== 'admin') {
    throw new Error('Admin access required');
  }
  
  return user;
}

// ✅ FIXED: No userId param - only get current user's balance
export const getCoinBalance = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return 0;
    
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q: any) => q.eq('clerkId', identity.subject!))
      .first();
    
    return user?.coinBalance || 0;
  },
});

// ✅ FIXED: No userId param - only get current user's history
export const getCoinHistory = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q: any) => q.eq('clerkId', identity.subject!))
      .first();
    
    if (!user) return [];
    
    const transactions = await ctx.db
      .query('coinTransactions')
      .withIndex('by_user', (q: any) => q.eq('userId', user._id))
      .order('desc')
      .collect();

    return transactions;
  },
});

// ✅ FIXED: No userId param - only get current user's redeem history
export const getRedeemHistory = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q: any) => q.eq('clerkId', identity.subject!))
      .first();
    
    if (!user) return [];
    
    return await ctx.db
      .query('redeemRequests')
      .withIndex('by_user', (q: any) => q.eq('userId', user._id))
      .order('desc')
      .collect();
  },
});

export const getRedeemRequestById = internalQuery({
  args: { redeemId: v.id('redeemRequests') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.redeemId);
  },
});

export const getUserById = internalQuery({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

export const getUserByClerkId = internalQuery({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q: any) => q.eq('clerkId', args.clerkId))
      .first();
  },
});

export const updateRedeemRequestPaymentInfo = internalMutation({
  args: {
    redeemId: v.id('redeemRequests'),
    midtransOrderId: v.string(),
    midtransSnapToken: v.string(),
    paymentStatus: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.redeemId, {
      midtransOrderId: args.midtransOrderId,
      midtransSnapToken: args.midtransSnapToken,
      paymentStatus: args.paymentStatus,
    });
  },
});

export const getRedeemRequestByMidtransOrder = internalQuery({
  args: { orderId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('redeemRequests')
      .withIndex('by_midtrans_order', (q: any) => q.eq('midtransOrderId', args.orderId))
      .first();
  },
});

export const getPendingRedeemRequestsByUser = internalQuery({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('redeemRequests')
      .withIndex('by_user', (q: any) => q.eq('userId', args.userId))
      .filter((q) => q.eq(q.field('status'), 'pending_payment'))
      .collect();
  },
});

export const getLastApprovedRedeemByUser = internalQuery({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('redeemRequests')
      .withIndex('by_user', (q: any) => q.eq('userId', args.userId))
      .filter((q) => q.eq(q.field('status'), 'approved'))
      .order('desc')
      .first();
  },
});

export const insertRedeemRequest = internalMutation({
  args: {
    userId: v.id('users'),
    coinAmount: v.number(),
    rupiahAmount: v.number(),
    bankCode: v.string(),
    accountNumber: v.string(),
    accountHolderName: v.string(),
    bankName: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('redeemRequests', {
      userId: args.userId,
      coinAmount: args.coinAmount,
      rupiahAmount: args.rupiahAmount,
      bankCode: args.bankCode,
      accountNumber: args.accountNumber,
      accountHolderName: args.accountHolderName,
      bankName: args.bankName,
      status: 'pending_payment',
      paymentStatus: 'pending',
      requestedAt: Date.now(),
    });
  },
});

export const deleteRedeemRequest = internalMutation({
  args: { redeemId: v.id('redeemRequests') },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.redeemId);
  },
});

export const patchRedeemPaymentStatus = internalMutation({
  args: {
    redeemId: v.id('redeemRequests'),
    paymentStatus: v.string(),
    status: v.optional(v.string()),
    rejectionReason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const update: any = { paymentStatus: args.paymentStatus };
    if (args.status) update.status = args.status;
    if (args.rejectionReason) update.rejectionReason = args.rejectionReason;
    await ctx.db.patch(args.redeemId, update);
  },
});

// ✅ FIXED: Verify admin + stop leaking PII
export const getAllPendingRedeems = query({
  args: {},
  handler: async (ctx) => {
    // Verify admin access
    await verifyAdmin(ctx);

    const pending = await ctx.db
      .query('redeemRequests')
      .withIndex('by_status', (q: any) => q.eq('status', 'pending'))
      .collect();

    // ✅ FIXED: Don't expose PII - only return necessary fields
    const result = [];
    for (const request of pending) {
      result.push({
        requestId: request._id,
        userId: request.userId,  // ID only, no PII
        status: request.status,
        coinAmount: request.coinAmount,
        bankName: request.bankName,
        requestedAt: request.requestedAt,
        // Removed: userName, userEmail (PII)
      });
    }

    return result;
  },
});

// New function: Get all redeems with filter by status
export const getAllRedeems = query({
  args: {
    status: v.optional(v.union(
      v.literal('all'),
      v.literal('pending'),
      v.literal('approved'),
      v.literal('rejected')
    )),
  },
  handler: async (ctx, args) => {
    // Verify admin access
    await verifyAdmin(ctx);

    const requests = args.status && args.status !== 'all'
      ? await ctx.db.query('redeemRequests')
          .withIndex('by_status', (q) => q.eq('status', args.status))
          .order('desc')
          .collect()
      : await ctx.db.query('redeemRequests')
          .order('desc')
          .collect();

    // Get user information for each request
    const result = [];
    for (const request of requests) {
      const user = await ctx.db.get(request.userId);
      if (user) {
        result.push({
          _id: request._id,
          userId: request.userId,
          userName: user.name,
          userEmail: user.email,
          coinAmount: request.coinAmount,
          rupiahAmount: request.rupiahAmount,
          bankCode: request.bankCode,
          accountNumber: request.accountNumber,
          accountHolderName: request.accountHolderName,
          bankName: request.bankName,
          status: request.status,
          requestedAt: request.requestedAt,
          processedAt: request.processedAt,
          rejectionReason: request.rejectionReason,
          disburseReference: request.disburseReference,
          disburseStatus: request.disburseStatus,
          disburseError: request.disburseError,
        });
      }
    }

    return result;
  },
});

// New function: Get redeem statistics
export const getRedeemStats = query({
  args: {},
  handler: async (ctx) => {
    // Verify admin access
    await verifyAdmin(ctx);

    const allRequests = await ctx.db.query('redeemRequests').collect();

    const totalRequests = allRequests.length;
    const pendingRequests = allRequests.filter(r => r.status === 'pending');
    const totalPending = pendingRequests.length;
    const totalPendingValue = pendingRequests.reduce((sum, r) => sum + r.rupiahAmount, 0);

    return {
      totalRequests,
      totalPending,
      totalPendingValue,
    };
  },
});

// ✅ FIXED: Add bounds validation + authorization check + correct Convex API
export const addCoins = mutation({
  args: {
    userId: v.id('users'),
    amount: v.number(),
    type: v.union(
      v.literal('course_complete'),
      v.literal('quiz_bonus'),
      v.literal('streak_bonus')
    ),
    courseId: v.optional(v.id('courses')),
    note: v.string(),
  },
  handler: async (ctx, args) => {
    // ✅ FIXED: Verify caller authorization
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Unauthorized');
    
    const caller = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q: any) => q.eq('clerkId', identity.subject!))
      .first();
    
    if (!caller) throw new Error('Caller user not found');
    
    // Only allow if caller owns the userId or is admin
    if (caller._id !== args.userId && caller.role !== 'admin') {
      throw new Error('Access denied - cannot modify other users\' coins');
    }
    
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error('User not found');

    // ✅ FIXED: Validate amount bounds
    if (!Number.isFinite(args.amount)) {
      throw new Error('Invalid amount');
    }
    if (args.amount <= 0) {
      throw new Error('Amount must be positive');
    }
    
    // Define limits per type
    const limits: Record<string, number> = {
      'course_complete': 500,
      'quiz_bonus': 100,
      'streak_bonus': 200,
    };
    
    const limit = limits[args.type] || 0;
    if (args.amount > limit) {
      throw new Error(`Amount exceeds ${args.type} limit of ${limit}`);
    }

    // ✅ FIXED: Read current balance and validate before updating
    const currentBalance = user.coinBalance;
    const newBalance = currentBalance + args.amount;
    
    if (!Number.isFinite(newBalance) || newBalance < 0) {
      throw new Error('Invalid balance calculation');
    }

    // Update balance
    await ctx.db.patch(args.userId, {
      coinBalance: newBalance,
    });

    // Record transaction
    await ctx.db.insert('coinTransactions', {
      userId: args.userId,
      amount: args.amount,
      type: args.type,
      courseId: args.courseId,
      note: args.note,
      createdAt: Date.now(),
      isExpired: false,
    });

    return newBalance;
  },
});

// ✅ FIXED: Add bounds validation + authorization check + correct Convex API
export const spendCoins = mutation({
  args: {
    userId: v.id('users'),
    amount: v.number(),
    courseId: v.optional(v.id('courses')),
    note: v.string(),
  },
  handler: async (ctx, args) => {
    // ✅ FIXED: Verify caller authorization
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Unauthorized');
    
    const caller = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q: any) => q.eq('clerkId', identity.subject!))
      .first();
    
    if (!caller) throw new Error('Caller user not found');
    
    // Only allow if caller owns the userId or is admin
    if (caller._id !== args.userId && caller.role !== 'admin') {
      throw new Error('Access denied - cannot modify other users\' coins');
    }
    
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error('User not found');

    // ✅ FIXED: Validate amount bounds
    if (!Number.isFinite(args.amount)) {
      throw new Error('Invalid amount');
    }
    if (args.amount <= 0) {
      throw new Error('Amount must be positive');
    }
    if (args.amount > 100000) {
      throw new Error('Amount exceeds maximum limit');
    }

    if (user.coinBalance < args.amount) {
      throw new Error('Saldo coin tidak cukup');
    }

    // ✅ FIXED: Read current balance and validate before updating
    const currentBalance = user.coinBalance;
    const newBalance = currentBalance - args.amount;
    
    if (!Number.isFinite(newBalance) || newBalance < 0) {
      throw new Error('Invalid balance calculation');
    }

    // Update balance
    await ctx.db.patch(args.userId, {
      coinBalance: newBalance,
    });

    // Record transaction - use 'redeem' type for spending
    await ctx.db.insert('coinTransactions', {
      userId: args.userId,
      amount: -args.amount,
      type: 'redeem',
      courseId: args.courseId,
      note: args.note,
      createdAt: Date.now(),
      isExpired: false,
    });

    return newBalance;
  },
});

// ✅ REFACTORED: Create redeem + Midtrans payment immediately
// Flow: User fills form → Direct to Midtrans payment page → Admin approval after payment
export const requestRedeem = action({
  args: {
    coinAmount: v.number(),
    bankCode: v.string(),
    accountNumber: v.string(),
    accountHolderName: v.string(),
    bankName: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Unauthorized');

    const user = await ctx.runQuery(internal.coins.getUserByClerkId, {
      clerkId: identity.subject!,
    });

    if (!user) throw new Error('User not found');
    const userId = user._id;

    if (user.coinBalance < args.coinAmount) {
      throw new Error('Saldo coin tidak cukup');
    }

    if (args.coinAmount < COIN_RULES.MIN_REDEEM) {
      throw new Error(`Minimum pencairan ${COIN_RULES.MIN_REDEEM.toLocaleString()} coin (Rp ${(COIN_RULES.MIN_REDEEM * COIN_RULES.RATE).toLocaleString()})`);
    }

    if (args.coinAmount > COIN_RULES.MAX_REDEEM) {
      throw new Error(`Maksimum pencairan ${COIN_RULES.MAX_REDEEM.toLocaleString()} coin per request`);
    }

    const pendingPayments = await ctx.runQuery(internal.coins.getPendingRedeemRequestsByUser, {
      userId,
    });

    if (pendingPayments.length > 0) {
      throw new Error('Masih ada pembayaran yang menunggu persetujuan admin');
    }

    const disbursedRequests = await ctx.runQuery(internal.coins.getLastApprovedRedeemByUser, {
      userId,
    });

    if (disbursedRequests && disbursedRequests.disbursedAt) {
      const cooldownMs = COIN_RULES.REDEEM_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
      const timeSinceDisburse = Date.now() - disbursedRequests.disbursedAt;
      if (timeSinceDisburse < cooldownMs) {
        const daysLeft = Math.ceil((cooldownMs - timeSinceDisburse) / (24 * 60 * 60 * 1000));
        throw new Error(`Pencairan berikutnya bisa dilakukan dalam ${daysLeft} hari`);
      }
    }

    const rupiahAmount = args.coinAmount * COIN_RULES.RATE;

    const redeemId = await ctx.runMutation(internal.coins.insertRedeemRequest, {
      userId,
      coinAmount: args.coinAmount,
      rupiahAmount,
      bankCode: args.bankCode,
      accountNumber: args.accountNumber,
      accountHolderName: args.accountHolderName,
      bankName: args.bankName,
    });

    try {
      const paymentResult = await ctx.runAction('payments:createRedeemPayment', {
        redeemId,
        coinAmount: args.coinAmount,
        rupiahAmount,
        bankCode: args.bankCode,
        accountNumber: args.accountNumber,
        accountHolderName: args.accountHolderName,
      });

      return {
        redeemId,
        snapToken: paymentResult.snapToken,
        redirectUrl: paymentResult.redirectUrl,
        orderId: paymentResult.orderId,
        rupiahAmount,
      };
    } catch (error) {
      await ctx.runMutation(internal.coins.deleteRedeemRequest, { redeemId });
      throw error;
    }
  },
});

export const processRedeem = mutation({
  args: {
    redeemId: v.id('redeemRequests'),
    status: v.union(v.literal('approved'), v.literal('rejected')),
    rejectionReason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Unauthorized');

    const adminUser = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject!))
      .first();

    if (!adminUser || adminUser.role !== 'admin') {
      throw new Error('Admin only');
    }

    const request = await ctx.db.get(args.redeemId);
    if (!request) throw new Error('Redeem request not found');

    // ✅ VERIFY: Payment must be completed first
    if (request.paymentStatus !== 'paid') {
      throw new Error('Payment not yet confirmed. User must complete Midtrans payment first.');
    }

    if (args.status === 'approved') {
      // ✅ APPROVED: Deduct coins + auto-disburse
      const user = await ctx.db.get(request.userId);
      if (!user) throw new Error('User not found');

      if (user.coinBalance < request.coinAmount) {
        throw new Error('Insufficient coin balance for disburse');
      }

      const newBalance = user.coinBalance - request.coinAmount;
      await ctx.db.patch(request.userId, { coinBalance: newBalance });

      // Record coin deduction transaction
      await ctx.db.insert('coinTransactions', {
        userId: request.userId,
        amount: -request.coinAmount,
        type: 'redeem',
        isExpired: false,
        note: `Admin approved redeem: ${request.coinAmount} coin -> Rp ${request.rupiahAmount} (Order: ${request.midtransOrderId})`,
        createdAt: Date.now(),
      });

      // Trigger auto-disburse to user's bank account
      try {
        await ctx.runAction(internal.payments.createDisburseOrder, {
          userId: request.userId,
          redeemId: args.redeemId,
          amount: Math.floor(request.rupiahAmount),
          bankCode: request.bankCode,
          accountNumber: request.accountNumber,
          accountHolderName: request.accountHolderName,
        });

        await ctx.db.patch(args.redeemId, {
          status: 'approved',
          approvedAt: Date.now(),
        });

        return {
          success: true,
          message: 'Redeem approved and disburse initiated',
        };
      } catch (error) {
        console.error('Auto-disburse failed:', error);
        
        // Refund coins if disburse fails
        await ctx.db.patch(request.userId, { coinBalance: user.coinBalance });
        await ctx.db.patch(args.redeemId, {
          disburseError: (error as Error).message,
        });

        return {
          success: true,
          message: 'Coins approved but disburse failed - admin will retry manually',
          disburseError: (error as Error).message,
        };
      }
    } else if (args.status === 'rejected') {
      // ✅ REJECTED: Payment needs manual refund
      // Admin must process refund in Midtrans dashboard
      await ctx.db.patch(args.redeemId, {
        status: 'rejected',
        rejectionReason: args.rejectionReason || 'Admin rejected - payment will be refunded',
        processedAt: Date.now(),
      });

      return {
        success: true,
        message: 'Redeem rejected. Admin must process refund in Midtrans dashboard.',
      };
    }

    return { success: false, message: 'Unknown status' };
  },
});

// Reset coin balance to 0 (for testing/admin purposes)
export const resetCoinBalance = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Unauthorized');
    
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q: any) => q.eq('clerkId', identity.subject!))
      .first();
    
    if (!user) throw new Error('User not found');

    // Reset balance to 0
    await ctx.db.patch(user._id, {
      coinBalance: 0,
    });

    // Record transaction for audit trail
    await ctx.db.insert('coinTransactions', {
      userId: user._id,
      amount: -user.coinBalance, // Negative amount to show reset
      type: 'admin_reset',
      note: 'Coin balance reset to 0',
      createdAt: Date.now(),
      isExpired: false,
    });

    return 0;
  },
});

// ✅ REFACTORED: Confirm payment after user completes Midtrans payment
// Called from client after Midtrans payment is completed
// This ONLY confirms payment - coins deduction happens when admin approves
export const confirmRedeemPayment = action({
  args: {
    redeemId: v.id('redeemRequests'),
  },
  handler: async (ctx, args) => {
    const redeem = await ctx.runQuery(internal.coins.getRedeemRequestById, {
      redeemId: args.redeemId,
    });
    if (!redeem) throw new Error('Redeem request not found');

    if (!redeem.midtransOrderId) {
      throw new Error('No Midtrans order found');
    }

    // Check payment status with Midtrans
    const response = await fetch(
      `${MIDTRANS_BASE_URL}/v2/${redeem.midtransOrderId}/status`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${base64Encode(MIDTRANS_SERVER_KEY + ':')}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to verify payment status with Midtrans');
    }

    const data = await response.json();
    const transactionStatus = data.transaction_status;

    // ✅ UPDATED: Only mark payment as paid - coins deduction happens in processRedeem
    if (
      transactionStatus === 'settlement' ||
      transactionStatus === 'capture' ||
      transactionStatus === 'success'
    ) {
      // Mark payment as confirmed (admin will review for coin deduction)
      await ctx.runMutation(internal.coins.patchRedeemPaymentStatus, {
        redeemId: args.redeemId,
        paymentStatus: 'paid',
      });

      return {
        success: true,
        message: 'Payment confirmed. Waiting for admin approval to disburse funds.',
        paymentStatus: 'paid',
      };
    } else if (
      transactionStatus === 'deny' ||
      transactionStatus === 'cancel' ||
      transactionStatus === 'expired'
    ) {
      // Payment failed - mark as failed
      await ctx.runMutation(internal.coins.patchRedeemPaymentStatus, {
        redeemId: args.redeemId,
        paymentStatus: 'failed',
        status: 'rejected',
        rejectionReason: `Payment ${transactionStatus}`,
      });
      
      return {
        success: false,
        message: `Payment ${transactionStatus}. Please try again.`,
        paymentStatus: 'failed',
      };
    } else {
      // Payment still pending
      return {
        success: false,
        message: 'Payment still pending. Please wait for confirmation.',
        paymentStatus: 'pending',
      };
    }
  },
});

// ✅ UPDATED: Refund coins if payment fails
// Called when payment is denied/cancelled/expired
async function refundRedeemPayment(ctx: any, redeemId: string, reason: string) {
  const redeem = await ctx.db.get(redeemId);
  if (!redeem) throw new Error('Redeem request not found');

  // Refund coins to user (coins were deducted when admin approved)
  const user = await ctx.db.get(redeem.userId);
  const newBalance = (user?.coinBalance || 0) + redeem.coinAmount;

  await ctx.db.patch(redeem.userId, {
    coinBalance: newBalance,
  });

  // Mark redeem as failed
  await ctx.db.patch(redeemId, {
    paymentStatus: 'failed',
    status: 'rejected',
    rejectionReason: `Payment ${reason} - coins refunded`,
  });

  // Record refund transaction
  await ctx.db.insert('coinTransactions', {
    userId: redeem.userId,
    amount: redeem.coinAmount,
    type: 'redeem',
    isExpired: false,
    note: `Redeem payment failed (${reason}) - coin refunded`,
    createdAt: Date.now(),
  });
}

// ✅ UPDATED: Manual cancel redeem (user initiates cancel before/after payment)
export const cancelRedeem = mutation({
  args: {
    redeemId: v.id('redeemRequests'),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Unauthorized');

    const redeem = await ctx.db.get(args.redeemId);
    if (!redeem) throw new Error('Redeem request not found');

    // ✅ UPDATED: Only allow cancel if payment is not yet paid
    if (redeem.paymentStatus === 'paid') {
      throw new Error('Cannot cancel - payment already confirmed');
    }

    // Verify user owns this redeem
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject!))
      .first();

    if (!user || user._id !== redeem.userId) {
      throw new Error('Unauthorized - not your redeem request');
    }

    // ✅ UPDATED: Only refund if status is approved (coins already deducted)
    if (redeem.status === 'approved') {
      const newBalance = user.coinBalance + redeem.coinAmount;
      await ctx.db.patch(user._id, {
        coinBalance: newBalance,
      });

      // Record refund transaction
      await ctx.db.insert('coinTransactions', {
        userId: user._id,
        amount: redeem.coinAmount,
        type: 'redeem',
        isExpired: false,
        note: 'Redeem cancelled by user - coin refunded',
        createdAt: Date.now(),
      });
    }

    // Mark as rejected
    await ctx.db.patch(args.redeemId, {
      paymentStatus: 'failed',
      status: 'rejected',
      rejectionReason: 'User cancelled redeem',
    });

    return true;
  },
});