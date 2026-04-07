import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    name: v.string(),
    email: v.string(),
    coinBalance: v.number(),
    xp: v.number(),
    streak: v.number(),
    lastActiveDate: v.optional(v.string()),
    role: v.union(v.literal('user'), v.literal('admin')),
  }).index('by_clerk_id', ['clerkId']),

  courses: defineTable({
    title: v.string(),
    description: v.string(),
    thumbnailUrl: v.string(),
    category: v.string(),
    type: v.union(v.literal('free'), v.literal('premium')),
    price: v.number(),
    coinReward: v.number(),
    totalLessons: v.number(),
    isPublished: v.boolean(),
  }).index('by_type', ['type']).index('by_published', ['isPublished']),

  lessons: defineTable({
    courseId: v.id('courses'),
    title: v.string(),
    videoUrl: v.string(),
    duration: v.number(),
    order: v.number(),
    quizQuestions: v.optional(
      v.array(
        v.object({
          question: v.string(),
          options: v.array(v.string()),
          correctIndex: v.number(),
        })
      )
    ),
  }).index('by_course', ['courseId']),

  enrollments: defineTable({
    userId: v.id('users'),
    courseId: v.id('courses'),
    enrolledAt: v.number(),
    completedAt: v.optional(v.number()),
    coinRewarded: v.boolean(),
  })
    .index('by_user', ['userId'])
    .index('by_user_course', ['userId', 'courseId']),

  progress: defineTable({
    userId: v.id('users'),
    lessonId: v.id('lessons'),
    watchedSeconds: v.number(),
    quizScore: v.optional(v.number()),
    isCompleted: v.boolean(),
  })
    .index('by_user', ['userId'])
    .index('by_lesson', ['lessonId'])
    .index('by_user_lesson', ['userId', 'lessonId']),

  coinTransactions: defineTable({
    userId: v.id('users'),
    amount: v.number(),
    type: v.union(
      v.literal('course_complete'),
      v.literal('quiz_bonus'),
      v.literal('streak_bonus'),
      v.literal('redeem'),
      v.literal('expired')
    ),
    courseId: v.optional(v.id('courses')),
    expiresAt: v.optional(v.number()),
    note: v.string(),
    createdAt: v.number(),
  }).index('by_user', ['userId']),

  payments: defineTable({
    userId: v.id('users'),
    courseId: v.id('courses'),
    amount: v.number(),
    status: v.union(
      v.literal('pending'),
      v.literal('success'),
      v.literal('failed')
    ),
    gatewayOrderId: v.optional(v.string()),
    paidAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_gateway_order', ['gatewayOrderId']),

  redeemRequests: defineTable({
    userId: v.id('users'),
    coinAmount: v.number(),
    rupiahAmount: v.number(),
    bankAccount: v.string(),
    bankName: v.string(),
    status: v.union(
      v.literal('pending'),
      v.literal('approved'),
      v.literal('rejected')
    ),
    requestedAt: v.number(),
    processedAt: v.optional(v.number()),
  })
    .index('by_user', ['userId'])
    .index('by_status', ['status']),
});
