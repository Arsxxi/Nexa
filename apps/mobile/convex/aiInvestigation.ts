import { v } from 'convex/values';
import { action, query, internalQuery, internalMutation } from './_generated/server';
import { internal } from './_generated/api';

const MISTRAL_API_URL = 'https://api.mistral.ai/v1/agents/completions';
const MISTRAL_MODEL = 'mistral-small-latest';

const SYSTEM_PROMPT = `Kamu adalah investigator keamanan yang menganalisa user yang mengajukan redeem coin di platform pembelajaran online.

DATA YANG AKAN KAMU TERIMA:
- Profil user (nama, email, streak, XP, level, coin balance)
- Riwayat transaksi coin (semua transaksi coin dalam 30 hari terakhir)
- Pola enrollment (kursus yang diambil, progres, durasi)
- Riwayat redeem sebelumnya (jumlah, status approve/reject)

TUGAS UTAMAMU:
Analisa data tersebut dan berikan keputusan dengan format BERIKUT (WAJIB pakai Bahasa Indonesia):

RISK_LEVEL: [LOW/MEDIUM/HIGH]
RECOMMENDATION: [APPROVE/REJECT/HOLD]
REASONING: [penjelasan kenapa, conclude, sertakan spesifik details dari data]

INDIKATOR MENCURIGAKAN (HIGH RISK):
- Menyelesaikan banyak course dalam waktu sangat singkat (< 1 jam per course)
- Progress video selalu tepat 80% atau angka yang sama berulang
- Belum enroll course sama sekali tapi langsung redeem
- Riwayat redeem sebelumnya banyak yang ditolak
- Jumlah redeem tidak proporsional dengan aktivitas
- Coin balance tidak masuk akal (misal: baru enroll 1 course tapi punya 5000 coin)
- Streak rendah tapi banyak course diselesaikan
- Coin dari bonus/streak bukan dari course completion

INDIKATOR LEGITIMATE (LOW RISK):
- Progress bervariasi natural (bukan 80% persis)
- Course completion dalam waktu wajar
- Coin balance proporsional dengan aktivitas
- Streak tinggi menunjukkan engagement konsisten
- Riwayat redeem sebelumnya sukses

HOLD (MEDIUM RISK):
- Ada beberapa tanda mencurigakan tapi tidak confirm
- Perlu review manual admin

PENTING: Berikan reasoning yang spesifik berdasarkan DATA yang diberikan, bukan asumsi.`;

export const getUserBehavior = internalQuery({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    const enrollments = await ctx.db
      .query('enrollments')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .collect();

    const totalProgress = await ctx.db
      .query('progress')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .collect();

    const completedLessons = totalProgress.filter(p => p.isCompleted).length;

    return {
      name: user.name,
      email: user.email,
      streak: user.streak,
      level: user.level || 1,
      xp: user.xp,
      coinBalance: user.coinBalance,
      lastActiveDate: user.lastActiveDate,
      enrollmentCount: enrollments.length,
      completedCourses: enrollments.filter(e => e.completedAt !== undefined).length,
      completedLessons,
      avgProgress: enrollments.length > 0
        ? (enrollments.reduce((acc, e) => {
            const lessonProgress = totalProgress.filter(p => {
              return true;
            }).length;
            return acc;
          }, 0) / enrollments.length)
        : 0,
    };
  },
});

export const getCoinHistory = internalQuery({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);

    const transactions = await ctx.db
      .query('coinTransactions')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .filter((q) => q.gte(q.field('createdAt'), thirtyDaysAgo))
      .order('desc')
      .collect();

    return transactions.map(t => ({
      amount: t.amount,
      type: t.type,
      note: t.note,
      createdAt: t.createdAt,
      isExpired: t.isExpired,
    }));
  },
});

export const checkEnrollmentPattern = internalQuery({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    const enrollments = await ctx.db
      .query('enrollments')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .collect();

    const enrollmentDetails = await Promise.all(
      enrollments.slice(0, 10).map(async (enrollment) => {
        const course = await ctx.db.get(enrollment.courseId);
        const progressRecords = await ctx.db
          .query('progress')
          .withIndex('by_user', (q) => q.eq('userId', args.userId))
          .collect();

        const lessons = course
          ? await ctx.db
              .query('lessons')
              .withIndex('by_course', (q) => q.eq('courseId', enrollment.courseId))
              .collect()
          : [];

        const completedLessons = progressRecords.filter(p =>
          lessons.some(l => l._id === p.lessonId) && p.isCompleted
        ).length;

        const totalDuration = lessons.reduce((acc, l) => acc + (l.duration || 0), 0);
        const watchedSeconds = progressRecords.reduce((acc, p) => {
          const lesson = lessons.find(l => l._id === p.lessonId);
          return acc + (lesson ? p.watchedSeconds : 0);
        }, 0);

        const enrollmentDuration = enrollment.completedAt
          ? enrollment.completedAt - enrollment.enrolledAt
          : (enrollment.enrolledAt ? Date.now() - enrollment.enrolledAt : 0);

        const progressPercent = totalDuration > 0
          ? Math.round((watchedSeconds / totalDuration) * 100)
          : 0;

        return {
          courseTitle: course?.title || 'Unknown',
          enrolledAt: enrollment.enrolledAt,
          completedAt: enrollment.completedAt,
          isCompleted: enrollment.completedAt !== undefined,
          coinReward: enrollment.coinRewarded,
          completedLessons,
          totalLessons: lessons.length,
          progressPercent,
          enrollmentDurationHours: Math.round(enrollmentDuration / (1000 * 60 * 60) * 10) / 10,
        };
      })
    );

    const completionTimes = enrollmentDetails
      .filter(e => e.completedAt && e.enrolledAt)
      .map(e => e.enrollmentDurationHours);

    const avgCompletionTime = completionTimes.length > 0
      ? completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length
      : 0;

    const progressValues = enrollmentDetails.map(e => e.progressPercent);
    const uniqueProgress = new Set(progressValues);
    const hasSuspiciousPattern = uniqueProgress.size <= 2 && progressValues.every(p => p === 80 || p === 100);

    return {
      totalEnrollments: enrollments.length,
      completionRate: enrollments.length > 0
        ? Math.round((enrollmentDetails.filter(e => e.isCompleted).length / enrollments.length) * 100)
        : 0,
      avgCompletionTimeHours: Math.round(avgCompletionTime * 10) / 10,
      enrollmentDetails: enrollmentDetails.slice(0, 5),
      hasSuspiciousPattern,
    };
  },
});

export const checkPreviousRedeems = internalQuery({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    const redeemRequests = await ctx.db
      .query('redeemRequests')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .order('desc')
      .collect();

    const totalRedeemed = redeemRequests
      .filter(r => r.status === 'approved' || r.paymentStatus === 'paid')
      .reduce((acc, r) => acc + r.coinAmount, 0);

    const rejectedCount = redeemRequests.filter(r => r.status === 'rejected').length;
    const approvedCount = redeemRequests.filter(r => r.status === 'approved').length;
    const totalCount = redeemRequests.length;

    const recentRedeems = redeemRequests.slice(0, 5).map(r => ({
      coinAmount: r.coinAmount,
      rupiahAmount: r.rupiahAmount,
      status: r.status,
      requestedAt: r.requestedAt,
      rejectionReason: r.rejectionReason,
    }));

    return {
      totalCount,
      approvedCount,
      rejectedCount,
      rejectionRate: totalCount > 0 ? Math.round((rejectedCount / totalCount) * 100) : 0,
      totalCoinRedeemed: totalRedeemed,
      recentRedeems,
      hasRecentRejections: rejectedCount > 0 && redeemRequests[0]?.status === 'rejected',
    };
  },
});

export const saveAiAnalysis = internalMutation({
  args: {
    redeemId: v.id('redeemRequests'),
    riskLevel: v.union(v.literal('LOW'), v.literal('MEDIUM'), v.literal('HIGH')),
    reasoning: v.string(),
    recommendation: v.union(v.literal('APPROVE'), v.literal('REJECT'), v.literal('HOLD')),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.redeemId, {
      aiRiskLevel: args.riskLevel,
      aiReasoning: args.reasoning,
      aiRecommendation: args.recommendation,
      aiAnalyzedAt: Date.now(),
    });
    return { success: true };
  },
});

export const investigateRedeemRequest = action({
  args: { redeemId: v.id('redeemRequests') },
  handler: async (ctx, args) => {
    const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
    const MISTRAL_AGENT_ID = process.env.MISTRAL_AGENT_ID;

    if (!MISTRAL_API_KEY || !MISTRAL_AGENT_ID) {
      console.error('Mistral API key or Agent ID not configured');
      return { success: false, error: 'Mistral not configured' };
    }

    const redeem = await ctx.runQuery(internal.coins.getRedeemRequestById, {
      redeemId: args.redeemId,
    });

    if (!redeem) {
      return { success: false, error: 'Redeem request not found' };
    }

    const userBehavior = await ctx.runQuery(internal.aiInvestigation.getUserBehavior, {
      userId: redeem.userId,
    });

    const coinHistory = await ctx.runQuery(internal.aiInvestigation.getCoinHistory, {
      userId: redeem.userId,
    });

    const enrollmentPattern = await ctx.runQuery(internal.aiInvestigation.checkEnrollmentPattern, {
      userId: redeem.userId,
    });

    const previousRedeems = await ctx.runQuery(internal.aiInvestigation.checkPreviousRedeems, {
      userId: redeem.userId,
    });

    const userData = await ctx.runQuery(internal.coins.getUserById, {
      userId: redeem.userId,
    });

    const dataSummary = `
PROFIL USER:
- Nama: ${userBehavior?.name || 'N/A'}
- Email: ${userBehavior?.email || 'N/A'}
- Streak: ${userBehavior?.streak || 0} hari
- Level: ${userBehavior?.level || 1}
- XP Total: ${userBehavior?.xp || 0}
- Coin Balance: ${userBehavior?.coinBalance?.toLocaleString('id-ID') || 0}
- Terakhir Aktif: ${userBehavior?.lastActiveDate || 'N/A'}

ENROLLMENT & PROGRESS:
- Total Kursus Diambil: ${enrollmentPattern?.totalEnrollments || 0}
- Kursus Selesai: ${enrollmentPattern?.completedCourses || 0}
- Completion Rate: ${enrollmentPattern?.completionRate || 0}%
- Rata-rata Waktu Penyelesaian: ${enrollmentPattern?.avgCompletionTimeHours || 0} jam
- Pola Mencurigakan: ${enrollmentPattern?.hasSuspiciousPattern ? 'YA' : 'TIDAK'}

DETAIL KURSUS:
${enrollmentPattern?.enrollmentDetails?.map((e: any) => `
  - ${e.courseTitle}
    Progress: ${e.progressPercent}% | Selesai: ${e.isCompleted ? 'Ya' : 'Tidak'}
    Durasi Pengerjaan: ${e.enrollmentDurationHours} jam
`).join('') || 'Tidak ada'}

RIWAYAT TRANSAKSI COIN (30 hari terakhir):
${coinHistory?.map((t: any) => `
  - ${t.amount > 0 ? '+' : ''}${t.amount} coin | ${t.type} | ${new Date(t.createdAt).toLocaleDateString('id-ID')}
`).join('') || 'Tidak ada transaksi'}

RIWAYAT REDEEM:
- Total Request: ${previousRedeems?.totalCount || 0}
- Approved: ${previousRedeems?.approvedCount || 0}
- Rejected: ${previousRedeems?.rejectedCount || 0}
- Rejection Rate: ${previousRedeems?.rejectionRate || 0}%
- Total Coin Di-redeem: ${previousRedeems?.totalCoinRedeemed?.toLocaleString('id-ID') || 0}

DETAIL REDEEM TERAKHIR:
${previousRedeems?.recentRedeems?.map((r: any) => `
  - ${r.coinAmount.toLocaleString('id-ID')} coin → Rp ${r.rupiahAmount.toLocaleString('id-ID')}
    Status: ${r.status} | ${new Date(r.requestedAt).toLocaleDateString('id-ID')}
    ${r.rejectionReason ? `Alasan Tolak: ${r.rejectionReason}` : ''}
`).join('') || 'Tidak ada'}

REDEEM REQUEST SAAT INI:
- Amount: ${redeem.coinAmount.toLocaleString('id-ID')} coin
- Nominal: Rp ${redeem.rupiahAmount.toLocaleString('id-ID')}
- Bank: ${redeem.bankName} (${redeem.accountNumber})
    `;

    try {
      const response = await fetch(MISTRAL_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${MISTRAL_API_KEY}`,
        },
        body: JSON.stringify({
          agent_id: MISTRAL_AGENT_ID,
          messages: [
            {
              role: 'system',
              content: SYSTEM_PROMPT,
            },
            {
              role: 'user',
              content: `Analisa user berikut untuk redeem request:\n\n${dataSummary}\n\nBerikan keputusanmu dalam format:\nRISK_LEVEL:\nRECOMMENDATION:\nREASONING:`,
            },
          ],
          max_tokens: 1024,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Mistral API error:', response.status, errorText);
        return { success: false, error: `Mistral API error: ${response.status}` };
      }

      const result = await response.json();
      const assistantMessage = result.choices?.[0]?.message?.content || result.outputs?.[0]?.content || '';

      const parsed = parseMistralResponse(assistantMessage);

      if (parsed) {
        await ctx.runMutation(internal.aiInvestigation.saveAiAnalysis, {
          redeemId: args.redeemId,
          riskLevel: parsed.riskLevel,
          reasoning: parsed.reasoning,
          recommendation: parsed.recommendation,
        });

        return {
          success: true,
          riskLevel: parsed.riskLevel,
          recommendation: parsed.recommendation,
          reasoning: parsed.reasoning,
        };
      }

      return { success: false, error: 'Failed to parse response' };
    } catch (error) {
      console.error('Mistral investigation error:', error);
      return { success: false, error: (error as Error).message };
    }
  },
});

function parseMistralResponse(response: string): {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  recommendation: 'APPROVE' | 'REJECT' | 'HOLD';
  reasoning: string;
} | null {
  const upperResponse = response.toUpperCase();

  const riskLine = upperResponse.split('\n').find(l => l.includes('RISK_LEVEL:'));
  const recLine = upperResponse.split('\n').find(l => l.includes('RECOMMENDATION:'));
  const reasonLines = upperResponse.split('\n').filter(l =>
    l.includes('REASONING:') || (!l.includes('RISK_') && !l.includes('RECOMMENDATION:') && l.trim().length > 20)
  );

  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | null = null;
  let recommendation: 'APPROVE' | 'REJECT' | 'HOLD' | null = null;
  let reasoning = '';

  if (riskLine) {
    const value = riskLine.split(':')[1]?.trim().replace(/[\[\]]/g, '');
    if (value === 'LOW' || value === 'MEDIUM' || value === 'HIGH') {
      riskLevel = value;
    }
  }

  if (recLine) {
    const value = recLine.split(':')[1]?.trim().replace(/[\[\]]/g, '');
    if (value === 'APPROVE' || value === 'REJECT' || value === 'HOLD') {
      recommendation = value;
    }
  }

  if (reasonLines.length > 0) {
    reasoning = reasonLines
      .map(l => l.replace(/^REASONING:\s*/i, '').trim())
      .filter(l => l.length > 10)
      .join(' ')
      .trim();

    const reasoningLine = upperResponse.split('\n').find(l => l.includes('REASONING:'));
    if (reasoningLine) {
      const idx = upperResponse.split('\n').indexOf(reasoningLine);
      const rest = upperResponse.split('\n').slice(idx + 1).join('\n').trim();
      if (rest.length > 10) {
        reasoning = rest;
      }
    }
  }

  if (!riskLevel || !recommendation || !reasoning) {
    const fallbackRisk = upperResponse.includes('HIGH') ? 'HIGH'
      : upperResponse.includes('MEDIUM') ? 'MEDIUM'
      : upperResponse.includes('LOW') ? 'LOW' : null;

    const fallbackRec = upperResponse.includes('REJECT') ? 'REJECT'
      : upperResponse.includes('APPROVE') ? 'APPROVE'
      : upperResponse.includes('HOLD') ? 'HOLD' : null;

    if (fallbackRisk && fallbackRec) {
      riskLevel = riskLevel || fallbackRisk as any;
      recommendation = recommendation || fallbackRec as any;
      reasoning = reasoning || response.substring(0, 500);
    } else {
      return null;
    }
  }

  return {
    riskLevel: riskLevel as 'LOW' | 'MEDIUM' | 'HIGH',
    recommendation: recommendation as 'APPROVE' | 'REJECT' | 'HOLD',
    reasoning,
  };
}

export const getRedeemWithAiAnalysis = query({
  args: { redeemId: v.id('redeemRequests') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.redeemId);
  },
});