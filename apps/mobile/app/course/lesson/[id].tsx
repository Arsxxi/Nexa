import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { VideoPlayer } from '@/components/VideoPlayer';
import { QuizModal } from '@/components/QuizModal';

export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [lesson, setLesson] = useState<any>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    // TODO: Replace with Convex query
    setLesson({
      _id: id,
      title: 'Introduction to React Native',
      description: 'In this lesson, we will cover the basics of React Native and how to set up your development environment.',
      videoUrl: 'https://example.com/video.mp4',
      courseId: '1',
      hasQuiz: true,
      quiz: {
        question: 'What is React Native?',
        options: [
          'A web framework',
          'A mobile framework',
          'A database',
          'A CSS library',
        ],
        correctAnswer: 1,
      },
    });
  }, [id]);

  const handleVideoEnd = () => {
    if (lesson?.hasQuiz) {
      setShowQuiz(true);
    } else {
      markComplete();
    }
  };

  const markComplete = async () => {
    // TODO: Call Convex mutation to mark lesson complete
    setCompleted(true);
  };

  const handleQuizComplete = (correct: boolean) => {
    setShowQuiz(false);
    if (correct) {
      markComplete();
    }
  };

  if (!lesson) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <VideoPlayer
        url={lesson.videoUrl}
        onEnd={handleVideoEnd}
      />

      <View style={styles.content}>
        <Text style={styles.title}>{lesson.title}</Text>
        <Text style={styles.description}>{lesson.description}</Text>

        {completed && (
          <View style={styles.completedBadge}>
            <Text style={styles.completedText}>Lesson Completed!</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Back to Course</Text>
        </TouchableOpacity>
      </View>

      <QuizModal
        visible={showQuiz}
        quiz={lesson.quiz}
        onClose={() => setShowQuiz(false)}
        onComplete={handleQuizComplete}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 20,
  },
  completedBadge: {
    backgroundColor: '#d1fae5',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  completedText: {
    color: '#065f46',
    fontWeight: '600',
  },
  backButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
