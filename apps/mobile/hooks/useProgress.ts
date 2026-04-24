import { useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';

export function useProgress(courseId?: string) {
  const currentUser = useQuery(api.users.getCurrentUser);
  
  const enrollmentsData = useQuery(
    api.progress.getEnrollmentsWithProgress,
    currentUser ? { userId: currentUser._id } : 'skip'
  );

  const courseProgress = enrollmentsData?.find(
    (e: any) => e.courseId === courseId
  );

  return {
    progress: courseProgress ?? null,
    loading: enrollmentsData === undefined,
    progressPercent: courseProgress?.progressPercent ?? 0,
    completedLessons: courseProgress?.completedLessons ?? 0,
    totalLessons: courseProgress?.totalLessons ?? 0,
  };
}