import { v } from 'convex/values';
import { mutation, query, internalQuery, internalMutation } from './_generated/server';
import { internal, api } from './_generated/api';

export const updateProgress = mutation({
  args: {
    userId: v.id('users'),
    lessonId: v.id('lessons'),
    watchedSeconds: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('progress')
      .withIndex('by_user_lesson', (q) =>
        q.eq('userId', args.userId).eq('lessonId', args.lessonId)
      )
      .first();

    if (existing) {
      if (existing.watchedSeconds >= args.watchedSeconds) {
        return existing._id;
      }
      await ctx.db.patch(existing._id, { watchedSeconds: args.watchedSeconds });
      return existing._id;
    }

    return await ctx.db.insert('progress', {
      userId: args.userId,
      lessonId: args.lessonId,
      watchedSeconds: args.watchedSeconds,
      isCompleted: false,
    });
  },
});

export const submitQuiz = mutation({
  args: {
    userId: v.id('users'),
    lessonId: v.id('lessons'),
    score: v.number(),
  },
  returns: v.object({ passed: v.boolean(), score: v.number() }),
  handler: async (ctx, args) => {
    const lesson = await ctx.db.get(args.lessonId);
    if (!lesson) throw new Error('Lesson not found');

    let isCompleted = false;
    const passThreshold = lesson.duration * 0.8;

    const existing = await ctx.db
      .query('progress')
      .withIndex('by_user_lesson', (q) =>
        q.eq('userId', args.userId).eq('lessonId', args.lessonId)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { quizScore: args.score });
      if (existing.watchedSeconds >= passThreshold && args.score >= 70) {
        isCompleted = true;
        await ctx.db.patch(existing._id, { isCompleted: true });
      }
    } else {
      const progressId = await ctx.db.insert('progress', {
        userId: args.userId,
        lessonId: args.lessonId,
        watchedSeconds: 0,
        quizScore: args.score,
        isCompleted: false,
      });
    }

    if (isCompleted) {
      await ctx.runMutation(internal.progress.checkAndCompleteCourse, {
        userId: args.userId,
        courseId: lesson.courseId,
      });
    }

    return { passed: isCompleted, score: args.score };
  },
});

export const completeLesson = mutation({
  args: {
    userId: v.id('users'),
    lessonId: v.id('lessons'),
    watchedSeconds: v.number(),
  },
  handler: async (ctx, args) => {
    const lesson = await ctx.db.get(args.lessonId);
    if (!lesson) throw new Error('Lesson not found');

    const requiredWatch = lesson.duration * 0.8;
    if (args.watchedSeconds < requiredWatch) {
      throw new Error('Must watch at least 80% of lesson');
    }

    const existing = await ctx.db
      .query('progress')
      .withIndex('by_user_lesson', (q) =>
        q.eq('userId', args.userId).eq('lessonId', args.lessonId)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { isCompleted: true });
    } else {
      await ctx.db.insert('progress', {
        userId: args.userId,
        lessonId: args.lessonId,
        watchedSeconds: args.watchedSeconds,
        isCompleted: true,
      });
    }

    await ctx.runMutation(internal.progress.checkAndCompleteCourse, {
      userId: args.userId,
      courseId: lesson.courseId,
    });
  },
});

export const checkAndCompleteCourse = internalMutation({
  args: {
    userId: v.id('users'),
    courseId: v.id('courses'),
  },
  handler: async (ctx, args) => {
    const course = await ctx.db.get(args.courseId);
    if (!course) return;

    const lessons = await ctx.db
      .query('lessons')
      .withIndex('by_course', (q) => q.eq('courseId', args.courseId))
      .collect();

    const totalLessons = lessons.length;
    if (totalLessons === 0) return;

    const completedProgress = await ctx.db
      .query('progress')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .filter((q) => q.eq(q.field('isCompleted'), true))
      .collect();

    const completedLessonIds = new Set(completedProgress.map((p) => p.lessonId));
    const completedLessons = lessons.filter((l) => completedLessonIds.has(l._id)).length;

    if (completedLessons >= totalLessons) {
      const enrollment = await ctx.db
        .query('enrollments')
        .withIndex('by_user_course', (q) =>
          q.eq('userId', args.userId).eq('courseId', args.courseId)
        )
        .first();

      if (!enrollment) return;

      if (!enrollment.completedAt) {
        await ctx.db.patch(enrollment._id, { completedAt: Date.now() });
      }

      if (!enrollment.coinRewarded) {
        try {
          await ctx.runMutation(internal.gamification.earnCoin, {
            userId: args.userId,
            courseId: args.courseId,
          });
        } catch (e) {
          console.log('earnCoin error:', e);
        }
      }

      await ctx.runMutation(api.gamification.addXP, {
        userId: args.userId,
        amount: 100,
        reason: 'course_complete',
      });
    }
  },
});

export const getEnrollmentsWithProgress = query({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    const enrollments = await ctx.db
      .query('enrollments')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .collect();

    const result = [];
    for (const enrollment of enrollments) {
      const course = await ctx.db.get(enrollment.courseId);
      if (!course) continue;

      const lessons = await ctx.db
        .query('lessons')
        .withIndex('by_course', (q) => q.eq('courseId', enrollment.courseId))
        .collect();

      const allProgress = await ctx.db
        .query('progress')
        .withIndex('by_user', (q) => q.eq('userId', args.userId))
        .collect();

      const lessonIds = new Set(lessons.map((l) => l._id));
      const completedLessons = allProgress.filter(
        (p) => p.isCompleted && lessonIds.has(p.lessonId)
      ).length;

      result.push({
        ...enrollment,
        course,
        totalLessons: lessons.length,
        completedLessons,
        progressPercent:
          lessons.length > 0
            ? Math.round((completedLessons / lessons.length) * 100)
            : 0,
      });
    }

    return result;
  },
});