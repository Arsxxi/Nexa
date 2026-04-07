import { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { CourseCard } from '@/components/CourseCard';
import { SkeletonCard } from '@/components/SkeletonCard';

export default function HomeScreen() {
  const router = useRouter();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      // TODO: Replace with Convex query
      setCourses([
        {
          _id: '1',
          title: 'React Native Basics',
          description: 'Learn the fundamentals of React Native',
          thumbnail: 'https://via.placeholder.com/300',
          lessons: 12,
          price: 0,
          isPremium: false,
        },
        {
          _id: '2',
          title: 'Advanced TypeScript',
          description: 'Master TypeScript for production apps',
          thumbnail: 'https://via.placeholder.com/300',
          lessons: 20,
          price: 50000,
          isPremium: true,
        },
      ]);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCourses();
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.header}>Explore Courses</Text>
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Explore Courses</Text>
      <FlatList
        data={courses}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <CourseCard
            course={item}
            onPress={() => router.push(`/course/${item._id}`)}
          />
        )}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
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
});
