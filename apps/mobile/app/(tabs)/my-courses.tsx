import { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { CourseCard } from '@/components/CourseCard';
import { ProgressBar } from '@/components/ProgressBar';

export default function MyCoursesScreen() {
  const router = useRouter();
  const [myCourses, setMyCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Replace with Convex query for enrolled courses
    setMyCourses([
      {
        _id: '1',
        title: 'React Native Basics',
        description: 'Learn the fundamentals of React Native',
        thumbnail: 'https://via.placeholder.com/300',
        lessons: 12,
        progress: 45,
      },
    ]);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.header}>My Courses</Text>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (myCourses.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.header}>My Courses</Text>
        <View style={styles.empty}>
          <Text style={styles.emptyText}>You haven't enrolled in any courses yet</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>My Courses</Text>
      <FlatList
        data={myCourses}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={styles.courseItem}>
            <CourseCard
              course={item}
              onPress={() => router.push(`/course/${item._id}`)}
            />
            <View style={styles.progressContainer}>
              <ProgressBar progress={item.progress} />
              <Text style={styles.progressText}>{item.progress}% complete</Text>
            </View>
          </View>
        )}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
    padding: 16,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  list: {
    gap: 12,
  },
  courseItem: {
    marginBottom: 8,
  },
  progressContainer: {
    marginTop: 8,
    paddingHorizontal: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
  },
});
