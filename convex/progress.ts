import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

export const getByUser = query({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('progress')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .collect();
  },
});

export const getByUserCourse = query({
  args: {
    userId: v.id('users'),
    courseId: v.id('courses'),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('progress')
      .withIndex('by_user_course', (q) =>
        q.eq('userId', args.userId).eq('courseId', args.courseId)
      )
      .first();
  },
});

export const markLessonComplete = mutation({
  args: {
    userId: v.id('users'),
    courseId: v.id('courses'),
    lessonId: v.id('lessons'),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('progress')
      .withIndex('by_user_course', (q) =>
        q.eq('userId', args.userId).eq('courseId', args.courseId)
      )
      .first();

    if (existing) {
      if (!existing.completedLessons.includes(args.lessonId)) {
        await ctx.db.patch(existing._id, {
          completedLessons: [...existing.completedLessons, args.lessonId],
        });
      }
      return existing._id;
    }

    return await ctx.db.insert('progress', {
      userId: args.userId,
      courseId: args.courseId,
      completedLessons: [args.lessonId],
      startedAt: Date.now(),
    });
  },
});

export const completeCourse = mutation({
  args: {
    userId: v.id('users'),
    courseId: v.id('courses'),
  },
  handler: async (ctx, args) => {
    const progress = await ctx.db
      .query('progress')
      .withIndex('by_user_course', (q) =>
        q.eq('userId', args.userId).eq('courseId', args.courseId)
      )
      .first();

    if (progress) {
      await ctx.db.patch(progress._id, {
        completedAt: Date.now(),
      });
    }
  },
});
