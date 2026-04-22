import { internalMutation } from './_generated/server';

export const backfillMissingLevels = internalMutation({
  handler: async (ctx) => {
    const all = await ctx.db.query('users').collect();
    let updated = 0;
    for (const u of all) {
      // If level is missing or null, set to 1
      if (u.level === undefined || u.level === null) {
        await ctx.db.patch(u._id, { level: 1 });
        updated++;
      }
    }
    return { updated };
  },
});
