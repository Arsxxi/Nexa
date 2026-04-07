import { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ProgressBar } from '@/components/ProgressBar';

export default function CourseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Replace with Convex query
    setCourse({
      _id: id,
      title: 'React Native Basics',
      description: 'Learn the fundamentals of React Native development including components, navigation, and state management.',
      thumbnail: 'https://via.placeholder.com/400x200',
      instructor: 'John Doe',
      lessons: [
        { _id: 'l1', title: 'Introduction to React Native', duration: '10 min', isFree: true },
        { _id: 'l2', title: 'Components & Props', duration: '15 min', isFree: true },
        { _id: 'l3', title: 'State Management', duration: '20 min', isFree: false },
        { _id: 'l4', title: 'Navigation', duration: '25 min', isFree: false },
      ],
      price: 0,
      isPremium: false,
      enrolled: true,
      progress: 25,
    });
    setLoading(false);
  }, [id]);

  if (loading || !course) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const handleLessonPress = (lesson: any) => {
    if (lesson.isFree || course.enrolled) {
      router.push(`/course/lesson/${lesson._id}`);
    } else {
      router.push(`/payment/${course._id}`);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Image source={{ uri: course.thumbnail }} style={styles.thumbnail} />

      <View style={styles.content}>
        <Text style={styles.title}>{course.title}</Text>
        <Text style={styles.instructor}>By {course.instructor}</Text>
        <Text style={styles.description}>{course.description}</Text>

        {course.enrolled && (
          <View style={styles.progressSection}>
            <Text style={styles.sectionTitle}>Your Progress</Text>
            <ProgressBar progress={course.progress} />
            <Text style={styles.progressText}>{course.progress}% complete</Text>
          </View>
        )}

        <View style={styles.lessonsSection}>
          <Text style={styles.sectionTitle}>Lessons</Text>
          {course.lessons.map((lesson: any, index: number) => (
            <TouchableOpacity
              key={lesson._id}
              style={styles.lessonItem}
              onPress={() => handleLessonPress(lesson)}
            >
              <View style={styles.lessonNumber}>
                <Text style={styles.lessonNumberText}>{index + 1}</Text>
              </View>
              <View style={styles.lessonInfo}>
                <Text style={styles.lessonTitle}>{lesson.title}</Text>
                <Text style={styles.lessonDuration}>{lesson.duration}</Text>
              </View>
              {lesson.isFree ? (
                <Ionicons name="play-circle" size={24} color="#6366f1" />
              ) : course.enrolled ? (
                <Ionicons name="lock-open" size={24} color="#10b981" />
              ) : (
                <Ionicons name="lock-closed" size={24} color="#9ca3af" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {!course.enrolled && !course.isPremium && (
          <TouchableOpacity
            style={styles.enrollButton}
            onPress={() => router.push(`/payment/${course._id}`)}
          >
            <Text style={styles.enrollButtonText}>Enroll Now - Free</Text>
          </TouchableOpacity>
        )}

        {!course.enrolled && course.isPremium && (
          <TouchableOpacity
            style={styles.enrollButton}
            onPress={() => router.push(`/payment/${course._id}`)}
          >
            <Text style={styles.enrollButtonText}>
              Unlock for {course.price.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  thumbnail: {
    width: '100%',
    height: 200,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  instructor: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 20,
  },
  progressSection: {
    marginBottom: 20,
  },
  lessonsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  lessonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    marginBottom: 8,
  },
  lessonNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  lessonNumberText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  lessonInfo: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  lessonDuration: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  enrollButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  enrollButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
