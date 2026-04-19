import { v } from 'convex/values';
import { mutation, query, internalQuery, internalMutation, action } from './_generated/server';
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

export const requestRedeem = mutation({
  args: {
    coinAmount: v.number(),
    bankCode: v.string(),
    accountNumber: v.string(),
    accountHolderName: v.string(),
    bankName: v.string(),
  },
  returns: v.id('redeemRequests'),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Unauthorized');

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject!))
      .first();

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

    const pendingRequests = await ctx.db
      .query('redeemRequests')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .filter((q) => q.eq(q.field('status'), 'pending'))
      .collect();

    if (pendingRequests.length > 0) {
      throw new Error('Masih ada request pencairan yang sedang diproses');
    }

    const approvedRequests = await ctx.db
      .query('redeemRequests')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .filter((q) => q.eq(q.field('status'), 'approved'))
      .order('desc')
      .first();

    if (approvedRequests) {
      const cooldownMs = COIN_RULES.REDEEM_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
      const daysSinceApproved = (Date.now() - approvedRequests.processedAt!) / cooldownMs;
      if (daysSinceApproved < 1) {
        throw new Error(`Pencairan berikutnya bisa dilakukan ${COIN_RULES.REDEEM_COOLDOWN_DAYS} hari setelah pencairan terakhir`);
      }
    }

    const rupiahAmount = (args.coinAmount / COIN_RULES.RATE) * 1000;
    const newBalance = user.coinBalance - args.coinAmount;
    await ctx.db.patch(userId, { coinBalance: newBalance });

    const redeemId = await ctx.db.insert('redeemRequests', {
      userId,
      coinAmount: args.coinAmount,
      rupiahAmount,
      bankCode: args.bankCode,
      accountNumber: args.accountNumber,
      accountHolderName: args.accountHolderName,
      bankName: args.bankName,
      status: 'pending',
      requestedAt: Date.now(),
    });

    await ctx.db.insert('coinTransactions', {
      userId,
      amount: -args.coinAmount,
      type: 'redeem',
      isExpired: false,
      note: `Request redeem: ${args.coinAmount} coin -> Rp ${rupiahAmount.toLocaleString()}`,
      createdAt: Date.now(),
    });

    return redeemId;
  },
});

export const processRedeem = action({
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

    await ctx.db.patch(args.redeemId, {
      status: args.status,
      processedAt: Date.now(),
      rejectionReason: args.rejectionReason,
    });

    if (args.status === 'approved') {
      // Calculate payout amount (coins / rate * 1000)
      const payoutAmount = Math.floor((request.coinAmount / COIN_RULES.RATE) * 1000);

      // Call Midtrans disburse
      try {
        await ctx.runAction('payments:createDisburseOrder', {
          userId: request.userId,
          redeemId: args.redeemId,
          amount: payoutAmount,
          bankCode: request.bankCode,
          accountNumber: request.accountNumber,
          accountHolderName: request.accountHolderName,
        });
      } catch (error) {
        console.error('Disburse failed:', error);
        // Mark as approved but disburse failed
        await ctx.db.patch(args.redeemId, {
          disburseStatus: 'failed',
          disburseError: error.message,
        });
        throw new Error(`Redeem approved but payout failed: ${error.message}`);
      }
    } else if (args.status === 'rejected') {
      const user = await ctx.db.get(request.userId);
      if (user) {
        const newBalance = user.coinBalance + request.coinAmount;
        await ctx.db.patch(request.userId, { coinBalance: newBalance });

        await ctx.db.insert('coinTransactions', {
          userId: request.userId,
          amount: request.coinAmount,
          type: 'redeem',
          isExpired: false,
          note: 'Pencairan ditolak - coin dikembalikan',
          createdAt: Date.now(),
        });
      }
    }

    return args.redeemId;
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