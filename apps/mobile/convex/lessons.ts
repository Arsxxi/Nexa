import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

export const getByCourse = query({
  args: { courseId: v.id('courses') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('lessons')
      .withIndex('by_course', (q) => q.eq('courseId', args.courseId))
      .collect();
  },
});

export const getById = query({
  args: { id: v.id('lessons') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('lessons', args);
  },
});
