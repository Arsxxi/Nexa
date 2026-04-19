import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';
import { ProgressBar } from '@/components/ProgressBar';

export default function CourseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const courseData = useQuery(api.courses.getCourseDetails, { courseId: id as any });
  const lessonsData = useQuery(api.lessons.getLessonsByCourse, { courseId: id as any });
  const enrollMutation = useMutation(api.courses.enrollFreeCourse);

  const isLoading = courseData === undefined || lessonsData === undefined;
  const error = courseData === null;

  const course = courseData;
  const lessons = lessonsData || [];

  const handleEnrollFree = async () => {
    try {
      const currentUser = await useQuery(api.users.getCurrentUser);
      if (currentUser) {
        await enrollMutation({ userId: currentUser._id, courseId: id as any });
      }
    } catch (err) {
      console.error('Enroll failed:', err);
    }
  };

  const handleLessonPress = (lesson: any) => {
    if (lesson.isFree || course?.isEnrolled) {
      router.push(`/course/lesson/${lesson._id}`);
    } else {
      router.push(`/payment/${id}`);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (error || !course) {
    return (
      <View style={styles.container}>
        <Text>Course not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Image source={{ uri: course.thumbnailUrl }} style={styles.thumbnail} />

      <View style={styles.content}>
        <Text style={styles.title}>{course.title}</Text>
        <Text style={styles.description}>{course.description}</Text>

        {course.isEnrolled && course.totalLessons && (
          <View style={styles.progressSection}>
            <Text style={styles.sectionTitle}>Your Progress</Text>
            <ProgressBar progress={0} />
            <Text style={styles.progressText}>0% complete</Text>
          </View>
        )}

        <View style={styles.lessonsSection}>
          <Text style={styles.sectionTitle}>Lessons ({lessons.length})</Text>
          {lessons.map((lesson: any, index: number) => (
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
                <Text style={styles.lessonDuration}>{lesson.duration} min</Text>
              </View>
              {course.isEnrolled || index === 0 ? (
                <Ionicons name="play-circle" size={24} color="#6366f1" />
              ) : (
                <Ionicons name="lock-closed" size={24} color="#9ca3af" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {!course.isEnrolled && course.type === 'free' && (
          <TouchableOpacity style={styles.enrollButton} onPress={handleEnrollFree}>
            <Text style={styles.enrollButtonText}>Enroll Now - Free</Text>
          </TouchableOpacity>
        )}

        {!course.isEnrolled && course.type === 'premium' && (
          <TouchableOpacity style={styles.enrollButton} onPress={() => router.push(`/payment/${id}`)}>
            <Text style={styles.enrollButtonText}>
              Unlock for {course.price?.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}
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
