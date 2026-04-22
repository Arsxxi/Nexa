import { View, Text, StyleSheet } from 'react-native';

interface VideoPlayerProps {
  url: string;
  lessonId: string;
  userId: string;
  duration: number;
  onEnd?: () => void;
  onProgress?: (seconds: number) => void;
}

export function VideoPlayer({ 
  url, 
  lessonId, 
  userId, 
  duration,
  onEnd, 
  onProgress 
}: VideoPlayerProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Video Player</Text>
      <Text style={styles.subtext}>URL: {url}</Text>
      <Text style={styles.subtext}>Duration: {duration}s</Text>
      <Text style={styles.note}>
        Note: Video playback requires a development build
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  subtext: {
    color: '#ccc',
    fontSize: 12,
    marginTop: 8,
  },
  note: {
    color: '#ffc800',
    fontSize: 10,
    marginTop: 16,
  },
});