import { cronJobs } from 'convex/server';
import { internal } from './_generated/api';

const crons = cronJobs();

crons.daily(
  'reset-daily-streaks',
  { hourUTC: 0, minuteUTC: 0 },
  internal.users.resetStaleStreaks
);

crons.weekly(
  'weekly-leaderboard-reset',
  { dayOfWeek: 'monday', hourUTC: 0, minuteUTC: 0 },
  internal.users.resetWeeklyLeaderboard
);

export default crons;
