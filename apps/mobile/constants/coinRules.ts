export const COIN_RULES = {
  lessonComplete: 10,
  quizCorrect: 20,
  courseComplete: 100,
  dailyStreak: 5,
  weeklyStreak: 50,
  firstCourse: 25,
  referral: 30,
};

export const STREAK_BONUS = {
  3: 10,
  7: 50,
  14: 100,
  30: 250,
};

export const BADGE_REQUIREMENTS = {
  firstLesson: { xp: 0, label: 'First Steps', icon: '🎯' },
  streak3: { xp: 0, label: 'Getting Hooked', icon: '🔥' },
  streak7: { xp: 0, label: 'Week Warrior', icon: '⚡' },
  course1: { xp: 0, label: 'Graduate', icon: '🎓' },
  course5: { xp: 0, label: 'Scholar', icon: '📚' },
  xp500: { xp: 500, label: 'Knowledge Seeker', icon: '🌟' },
  xp1000: { xp: 1000, label: 'Expert', icon: '💎' },
};
