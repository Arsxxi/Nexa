import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';
import { VideoPlayer } from '@/components/VideoPlayer';
import { QuizModal } from '@/components/QuizModal';

const TYPOGRAPHY = {
  h1: { fontFamily: 'SpaceGrotesk-Bold', fontWeight: '700' as const },
  h2: { fontFamily: 'nimbus-mono.regular', fontWeight: '400' as const },
  h3: { fontFamily: 'LiberationSans-Regular', fontWeight: '400' as const },
};

export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [showQuiz, setShowQuiz] = useState(false);
  const [actualDuration, setActualDuration] = useState(0);

  const lesson = useQuery(api.lessons.getById, { id: id as any });
  const currentUser = useQuery(api.users.getCurrentUser);

  const userProgress = useQuery(
    api.progress.getLessonProgress,
    currentUser && lesson 
      ? { userId: currentUser._id, lessonId: lesson._id } 
      : 'skip'
  );

  const updateProgressMutation = useMutation(api.progress.updateProgress);
  const completeLessonMutation = useMutation(api.progress.completeLesson);
  const submitQuizMutation = useMutation(api.progress.submitQuiz);

  const handleProgress = useCallback(async (watchedSeconds: number) => {
    if (!currentUser || !lesson) return;
    try {
      await updateProgressMutation({
        userId: currentUser._id,
        lessonId: lesson._id,
        watchedSeconds,
      });
    } catch (e) {
      console.error('Update progress error:', e);
    }
  }, [currentUser, lesson, updateProgressMutation]);

  const handleDurationChange = useCallback((newDuration: number) => {
    console.log('[LessonScreen] Received actual duration:', newDuration);
    setActualDuration(newDuration);
  }, []);

  const handleVideoEnd = async () => {
    console.log('[LessonScreen] handleVideoEnd called. quizQuestions:', lesson?.quizQuestions);
    if (!currentUser || !lesson) return;

    // More robust quiz detection
    const hasQuiz = lesson?.quizQuestions && 
                  Array.isArray(lesson.quizQuestions) && 
                  lesson.quizQuestions.length > 0 &&
                  lesson.quizQuestions[0]?.question;

    console.log('[LessonScreen] hasQuiz:', hasQuiz);

    if (hasQuiz) {
      console.log('[LessonScreen] Showing quiz modal');
      setShowQuiz(true);
    } else {
      console.log('[LessonScreen] No quiz, completing lesson directly');
      try {
        await completeLessonMutation({
          userId: currentUser._id,
          lessonId: lesson._id,
          watchedSeconds: actualDuration > 0 ? actualDuration : lesson.duration,
        });
        console.log('[LessonScreen] Lesson completed successfully');
      } catch (e: any) {
        console.error('Complete lesson error:', e.message);
      }
    }
  };

  const handleQuizComplete = async (correct: boolean) => {
    setShowQuiz(false);
    if (!currentUser || !lesson) return;

    const score = correct ? 100 : 0;
    try {
      console.log('[LessonScreen] Submitting quiz with score:', score);
      await submitQuizMutation({
        userId: currentUser._id,
        lessonId: lesson._id,
        score,
      });
      
      // After quiz, mark lesson as complete
      console.log('[LessonScreen] Marking lesson as complete after quiz');
      await completeLessonMutation({
        userId: currentUser._id,
        lessonId: lesson._id,
        watchedSeconds: actualDuration > 0 ? actualDuration : lesson.duration,
      });
      console.log('[LessonScreen] Lesson completed after quiz');
    } catch (e) {
      console.error('Submit quiz error:', e);
    }
  };

  if (lesson === undefined || currentUser === undefined) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFC800" />
      </View>
    );
  }

  if (!lesson) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Lesson tidak ditemukan</Text>
      </View>
    );
  }

  const displayDuration = actualDuration > 0 ? actualDuration : lesson.duration;
  const isCompleted = userProgress?.isCompleted ?? false;
  const watchedPercent = displayDuration > 0
    ? Math.min(100, Math.round(((userProgress?.watchedSeconds ?? 0) / displayDuration) * 100))
    : 0;

  return (
    <View style={styles.container}>
      <VideoPlayer
        url={lesson.videoUrl}
        lessonId={lesson._id}
        userId={currentUser._id}
        duration={actualDuration > 0 ? actualDuration : lesson.duration}
        onProgress={handleProgress}
        onEnd={handleVideoEnd}
        onDurationChange={handleDurationChange}
      />

      <ScrollView style={styles.content}>
        {isCompleted && (
          <View style={styles.completedBadge}>
            <Text style={styles.completedText}>✓ Lesson Selesai</Text>
          </View>
        )}

        {!isCompleted && watchedPercent > 0 && (
          <View style={styles.progressInfo}>
            <Text style={styles.progressText}>
              Sudah ditonton: {watchedPercent}% 
              {watchedPercent < 80 ? ' (butuh 80% untuk selesai)' : ' ✓'}
            </Text>
          </View>
        )}

        <Text style={styles.title}>{lesson.title}</Text>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>← Kembali ke Course</Text>
        </TouchableOpacity>
      </ScrollView>

      <QuizModal
        visible={showQuiz}
        quiz={{
          question: lesson.quizQuestions[0]?.question ?? '',
          options: lesson.quizQuestions[0]?.options ?? [],
          correctAnswer: lesson.quizQuestions[0]?.correctIndex ?? 0,
        }}
        onClose={() => setShowQuiz(false)}
        onComplete={handleQuizComplete}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 16 },
  title: { fontSize: 20, fontWeight: '700', color: '#18181B', marginBottom: 16 },
  completedBadge: {
    backgroundColor: '#D1FAE5', padding: 12,
    borderRadius: 8, alignItems: 'center', marginBottom: 12,
  },
  completedText: { color: '#065F46', fontWeight: '700' },
  progressInfo: {
    backgroundColor: '#FEF3C7', padding: 10,
    borderRadius: 8, marginBottom: 12,
  },
  progressText: { color: '#92400E', fontSize: 13, fontWeight: '600' },
  backButton: {
    backgroundColor: '#FFC800', borderRadius: 12,
    padding: 16, alignItems: 'center', marginTop: 8,
  },
  backButtonText: { color: '#18181B', fontSize: 15, fontWeight: '700' },
});