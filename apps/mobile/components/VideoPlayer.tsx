import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { AVPlaybackStatus, ResizeMode, Video } from 'expo-av';

interface VideoPlayerProps {
  url: string;
  onEnd?: () => void;
}

export function VideoPlayer({ url, onEnd }: VideoPlayerProps) {
  const [status, setStatus] = useState<AVPlaybackStatus | null>(null);

  const handlePlaybackStatusUpdate = (newStatus: AVPlaybackStatus) => {
    setStatus(newStatus);
    if (newStatus.isLoaded && newStatus.didJustFinish) {
      onEnd?.();
    }
  };

  return (
    <View style={styles.container}>
      <Video
        source={{ uri: url }}
        style={styles.video}
        useNativeControls
        resizeMode={ResizeMode.CONTAIN}
        onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
  },
  video: {
    flex: 1,
  },
});
