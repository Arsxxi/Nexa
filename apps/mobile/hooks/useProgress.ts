import { useState, useEffect } from 'react';

interface ProgressData {
  courseId: string;
  completedLessons: string[];
  totalLessons: number;
  percentage: number;
}

export function useProgress(courseId?: string) {
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!courseId) {
      setLoading(false);
      return;
    }

    // TODO: Replace with Convex query
    const fetchProgress = async () => {
      setLoading(true);
      try {
        setProgress({
          courseId,
          completedLessons: ['l1'],
          totalLessons: 12,
          percentage: 8,
        });
      } catch (error) {
        console.error('Failed to fetch progress:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, [courseId]);

  const markLessonComplete = async (lessonId: string) => {
    // TODO: Call Convex mutation
    if (progress) {
      setProgress({
        ...progress,
        completedLessons: [...progress.completedLessons, lessonId],
        percentage: Math.round(
          ((progress.completedLessons.length + 1) / progress.totalLessons) * 100
        ),
      });
    }
  };

  return { progress, loading, markLessonComplete };
}
