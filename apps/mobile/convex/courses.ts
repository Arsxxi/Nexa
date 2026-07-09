import { v } from 'convex/values';
import { query, mutation, internalQuery, internalMutation } from './_generated/server';

export const getCourses = query({
  args: {
    type: v.optional(v.union(v.literal('free'), v.literal('premium'))),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let courses = await ctx.db
      .query('courses')
      .withIndex('by_published', (q) => q.eq('isPublished', true))
      .collect();

    if (args.type) {
      courses = courses.filter((c) => c.type === args.type);
    }
    if (args.category) {
      courses = courses.filter((c) => c.category === args.category);
    }

    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return courses.map((c) => ({ ...c, isEnrolled: false }));
    }

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject!))
      .first();

    if (!user) {
      return courses.map((c) => ({ ...c, isEnrolled: false }));
    }

    const enrollments = await ctx.db
      .query('enrollments')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .collect();

    const enrolledCourseIds = new Set(enrollments.map((e) => e.courseId));

    return courses.map((c) => ({
      ...c,
      isEnrolled: enrolledCourseIds.has(c._id),
    }));
  },
});

export const getEnrolledCourses = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject!))
      .first();

    if (!user) return [];

    const enrollments = await ctx.db
      .query('enrollments')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .collect();

    const result = [];
    for (const enrollment of enrollments) {
      const course = await ctx.db.get(enrollment.courseId);
      if (!course) continue;

      const allProgress = await ctx.db
        .query('progress')
        .withIndex('by_user', (q) => q.eq('userId', user._id))
        .collect();

      const lessons = await ctx.db
        .query('lessons')
        .withIndex('by_course', (q) => q.eq('courseId', course._id))
        .collect();

      const lessonIds = new Set(lessons.map((l) => l._id));
      const completedLessons = allProgress.filter(
        (p) => p.isCompleted && lessonIds.has(p.lessonId)
      ).length;

      const totalLessons = lessons.length;
      const percentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

      result.push({
        ...course,
        completedAt: enrollment.completedAt,
        coinRewarded: enrollment.coinRewarded,
        progress: percentage,
        completedLessons,
        totalLessons,
      });
    }

    return result;
  },
});

export const getCourseDetails = query({
  args: { courseId: v.id('courses') },
  handler: async (ctx, args) => {
    const course = await ctx.db.get(args.courseId);
    if (!course) return null;

    const identity = await ctx.auth.getUserIdentity();
    let isEnrolled = false;
    let totalEnrolled = 0;
    let completedLessons = 0;
    let progress = 0;

    const allEnrollments = await ctx.db
      .query('enrollments')
      .withIndex('by_course', (q) => q.eq('courseId', args.courseId))
      .collect();
    totalEnrolled = allEnrollments.length;

    if (identity) {
      const user = await ctx.db
        .query('users')
        .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject!))
        .first();

      if (user) {
        const enrollment = await ctx.db
          .query('enrollments')
          .withIndex('by_user_course', (q) =>
            q.eq('userId', user._id).eq('courseId', args.courseId)
          )
          .first();
        isEnrolled = !!enrollment;

        if (isEnrolled) {
          const lessons = await ctx.db
            .query('lessons')
            .withIndex('by_course', (q) => q.eq('courseId', args.courseId))
            .collect();

          const allProgress = await ctx.db
            .query('progress')
            .withIndex('by_user', (q) => q.eq('userId', user._id))
            .collect();

          const lessonIds = new Set(lessons.map((l) => l._id));
          completedLessons = allProgress.filter(
            (p) => p.isCompleted && lessonIds.has(p.lessonId)
          ).length;

          progress = lessons.length > 0
            ? Math.round((completedLessons / lessons.length) * 100)
            : 0;
        }
      }
    }

    return { ...course, isEnrolled, totalEnrolled, completedLessons, progress };
  },
});

export const getLessonsByCourse = query({
  args: { courseId: v.id('courses') },
  handler: async (ctx, args) => {
    const lessons = await ctx.db
      .query('lessons')
      .withIndex('by_course', (q) => q.eq('courseId', args.courseId))
      .collect();

    lessons.sort((a, b) => a.order - b.order);

    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return lessons.map((l) => ({ ...l, videoUrl: null }));
    }

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject!))
      .first();

    if (!user) {
      return lessons.map((l) => ({ ...l, videoUrl: null }));
    }

    const enrollment = await ctx.db
      .query('enrollments')
      .withIndex('by_user_course', (q) =>
        q.eq('userId', user._id).eq('courseId', args.courseId)
      )
      .first();

    if (!enrollment) {
      return lessons.map((l) => ({ ...l, videoUrl: null }));
    }

    return lessons;
  },
});

export const enrollFreeCourse = mutation({
  args: {
    userId: v.id('users'),
    courseId: v.id('courses'),
  },
  handler: async (ctx, args) => {
    const course = await ctx.db.get(args.courseId);
    if (!course) throw new Error('Course not found');
    if (course.type !== 'free') throw new Error('Course is not free');

    const existing = await ctx.db
      .query('enrollments')
      .withIndex('by_user_course', (q) =>
        q.eq('userId', args.userId).eq('courseId', args.courseId)
      )
      .first();

    if (existing) throw new Error('Already enrolled');

    return await ctx.db.insert('enrollments', {
      userId: args.userId,
      courseId: args.courseId,
      enrolledAt: Date.now(),
      coinRewarded: false,
    });
  },
});

export const checkEnrollment = query({
  args: {
    userId: v.id('users'),
    courseId: v.id('courses'),
  },
  handler: async (ctx, args) => {
    const enrollment = await ctx.db
      .query('enrollments')
      .withIndex('by_user_course', (q) =>
        q.eq('userId', args.userId).eq('courseId', args.courseId)
      )
      .first();

    return !!enrollment;
  },
});

export const enrollAfterPayment = internalMutation({
  args: {
    userId: v.id('users'),
    courseId: v.id('courses'),
  },
  handler: async (ctx, args) => {
    const course = await ctx.db.get(args.courseId);
    if (!course) throw new Error('Course not found');

    const existing = await ctx.db
      .query('enrollments')
      .withIndex('by_user_course', (q) =>
        q.eq('userId', args.userId).eq('courseId', args.courseId)
      )
      .first();

    if (existing) return existing._id;

    return await ctx.db.insert('enrollments', {
      userId: args.userId,
      courseId: args.courseId,
      enrolledAt: Date.now(),
      coinRewarded: false,
    });
  },
});