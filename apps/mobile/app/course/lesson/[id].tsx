import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';
import { VideoPlayer } from '@/components/VideoPlayer';
import { QuizModal, QuizAnswer } from '@/components/QuizModal';
import { Ionicons } from '@expo/vector-icons';

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
  const course = useQuery(api.lessons.getCourseByLesson, { lessonId: id as any });
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

  const handleQuizComplete = async (score: number, total: number, answers: QuizAnswer[]) => {
    setShowQuiz(false);
    if (!currentUser || !lesson) return;

    const passed = score >= 70;
    try {
      console.log('[LessonScreen] Submitting quiz with score:', score, 'answers:', answers.length);
      await submitQuizMutation({
        userId: currentUser._id,
        lessonId: lesson._id,
        score,
        answers,
      });
      
      if (passed) {
        console.log('[LessonScreen] Quiz passed, marking lesson as complete');
        await completeLessonMutation({
          userId: currentUser._id,
          lessonId: lesson._id,
          watchedSeconds: actualDuration > 0 ? actualDuration : lesson.duration,
        });
        console.log('[LessonScreen] Lesson completed after quiz');
      } else {
        console.log('[LessonScreen] Quiz failed, user can retry');
      }
    } catch (e) {
      console.error('Submit quiz error:', e);
    }
  };

  if (lesson === undefined || currentUser === undefined) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFCC00" />
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

  const hasQuiz = lesson?.quizQuestions && lesson.quizQuestions.length > 0;

  return (
    <View style={styles.container}>
      {/* HEADER TOP BAR */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerIcon}>
          <Ionicons name="arrow-back" size={24} color="#FFCC00" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerSubtitle}>LESSON {(lesson?.order ?? 1)} OF {(course?.totalLessons ?? 1)}</Text>
          <Text style={styles.headerTitle}>{course?.title?.toUpperCase() ?? 'COURSE'}</Text>
        </View>
        <TouchableOpacity style={styles.headerIcon}>
          <Ionicons name="ellipsis-vertical" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      {/* VIDEO SECTION */}
      <View style={styles.videoWrapper}>
        <VideoPlayer
          url={lesson.videoUrl}
          lessonId={lesson._id}
          userId={currentUser._id}
          duration={actualDuration > 0 ? actualDuration : lesson.duration}
          onProgress={handleProgress}
          onEnd={handleVideoEnd}
          onDurationChange={handleDurationChange}
        />
        {/* Pagination Dots Indicator Mockup */}
        <View style={styles.dotsContainer}>
          {Array.from({ length: course?.totalLessons ?? 1 }).map((_, idx) => (
            <View
              key={idx}
              style={[styles.dot, idx === (lesson?.order ?? 1) - 1 && styles.dotActive]}
            />
          ))}
        </View>
      </View>

      {/* CONTENT SECTION */}
      <ScrollView style={styles.contentArea} contentContainerStyle={styles.contentScroll}>
        
        {/* Progress & Badge Indicator */}
        <View style={styles.statusContainer}>
          {isCompleted && (
            <View style={styles.completedBadge}>
              <Text style={styles.completedText}>✓ Selesai</Text>
            </View>
          )}
          {!isCompleted && watchedPercent > 0 && (
            <Text style={styles.progressText}>
              Progress: {watchedPercent}% {watchedPercent < 80 ? '(Minimal 80%)' : '✓'}
            </Text>
          )}
        </View>

        <Text style={styles.courseTag}>COURSE: {course?.category?.toUpperCase() ?? 'COURSE'}</Text>
        <Text style={styles.lessonHeading}>{lesson.title}</Text>
        <Text style={styles.lessonDescription}>
          {lesson.description ?? course?.description ?? ""}
        </Text>

      

        {/* ATTACHMENTS & DISCUSSIONS CARDS */}
        <View style={styles.cardsRow}>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>ATTACHMENTS</Text>
            <View style={styles.cardRowInner}>
              <Ionicons name="document-text-outline" size={18} color="#927342" />
              <Text style={styles.cardTitle}>Video</Text>
            </View>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>DISCUSSION</Text>
            <View style={styles.cardRowInner}>
              <Ionicons name="chatbubbles-outline" size={18} color="#927342" />
              <Text style={styles.cardTitle}></Text>
            </View>
          </View>
        </View>

        {/* BOTTOM ACTION BUTTON */}
        <View style={styles.bottomSection}>
          <Text style={styles.bottomLabel}>SELESAIKAN LESSON INI</Text>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => hasQuiz ? setShowQuiz(true) : router.back()}
          >
            {hasQuiz && <View style={styles.buttonSquareIcon} />}
            <Text style={styles.actionButtonText}>
              {hasQuiz ? "MULAI KUIS" : "KEMBALI KE COURSE"}
            </Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      <QuizModal
        visible={showQuiz}
        quiz={lesson.quizQuestions ?? []}
        onClose={() => setShowQuiz(false)}
        onComplete={handleQuizComplete}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111111', // Background dasar (Header & Video area)
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111111',
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16, // Sesuaikan dengan insets jika menggunakan SafeArea
    paddingBottom: 16,
    backgroundColor: '#181818',
  },
  headerIcon: {
    padding: 4,
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerSubtitle: {
    color: '#9CA3AF',
    fontSize: 10,
    letterSpacing: 2,
    marginBottom: 4,
  },
  headerTitle: {
    color: '#FFCC00',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  videoWrapper: {
    backgroundColor: '#000',
    paddingBottom: 12,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    backgroundColor: '#4B5563',
    borderRadius: 0, // Dibuat kotak sesuai desain
  },
  dotActive: {
    backgroundColor: '#FFCC00',
  },
  contentArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  contentScroll: {
    padding: 24,
    paddingBottom: 40,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  completedBadge: {
    backgroundColor: '#D1FAE5',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  completedText: {
    color: '#065F46',
    fontWeight: '700',
    fontSize: 12,
  },
  progressText: {
    color: '#92400E',
    fontSize: 12,
    fontWeight: '600',
  },
  courseTag: {
    color: '#6B7280',
    fontSize: 11,
    letterSpacing: 1.5,
    fontFamily: 'monospace',
    marginBottom: 12,
  },
  lessonHeading: {
    fontSize: 26,
    color: '#111827',
    fontWeight: '500',
    marginBottom: 16,
  },
  lessonDescription: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 22,
    marginBottom: 24,
  },
  nextMaterialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#D1D5DB',
    alignSelf: 'flex-start',
    paddingBottom: 4,
    marginBottom: 40,
  },
  nextMaterialText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
    letterSpacing: 1,
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 40,
  },
  card: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 8,
  },
  cardLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    letterSpacing: 1,
    marginBottom: 8,
  },
  cardRowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '500',
    flexShrink: 1,
  },
  bottomSection: {
    alignItems: 'center',
    marginTop: 16,
  },
  bottomLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    letterSpacing: 2,
    marginBottom: 16,
    fontFamily: 'monospace',
  },
  actionButton: {
    backgroundColor: '#FFCC00',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonSquareIcon: {
    width: 8,
    height: 8,
    backgroundColor: '#000',
    marginRight: 10,
  },
  actionButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
});