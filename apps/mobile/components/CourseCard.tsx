import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';

interface CourseCardProps {
  course: {
    _id: string;
    title: string;
    description: string;
    thumbnail: string;
    lessons?: number;
    price?: number;
    isPremium?: boolean;
    progress?: number;
  };
  onPress: () => void;
}

export function CourseCard({ course, onPress }: CourseCardProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <Image source={{ uri: course.thumbnail }} style={styles.thumbnail} />
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {course.title}
        </Text>
        <Text style={styles.description} numberOfLines={2}>
          {course.description}
        </Text>
        <View style={styles.footer}>
          <Text style={styles.lessons}>{course.lessons} lessons</Text>
          {course.isPremium ? (
            <Text style={styles.price}>
              {course.price === 0
                ? 'Free'
                : course.price?.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}
            </Text>
          ) : (
            <View style={styles.freeBadge}>
              <Text style={styles.freeText}>Free</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  thumbnail: {
    width: '100%',
    height: 160,
  },
  content: {
    padding: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lessons: {
    fontSize: 12,
    color: '#9ca3af',
  },
  price: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6366f1',
  },
  freeBadge: {
    backgroundColor: '#d1fae5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  freeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#065f46',
  },
});
