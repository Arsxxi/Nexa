import { useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';

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
  onProgress,
}: VideoPlayerProps) {
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasEnded = useRef(false);

  const player = useVideoPlayer(url, (p) => {
    p.loop = false;
    p.play();
  });

  // Track progress setiap 5 detik
  useEffect(() => {
    if (!onProgress) return;

    progressInterval.current = setInterval(() => {
      if (player && player.currentTime > 0) {
        onProgress(Math.floor(player.currentTime));
      }
    }, 5000);

    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, [player, onProgress]);

  // Deteksi video selesai
  useEffect(() => {
    if (!onEnd) return;

    const subscription = player.addListener('playingChange', (isPlaying) => {
      // Video selesai kalau berhenti play dan sudah mendekati akhir
      if (!isPlaying && !hasEnded.current && player.currentTime > 0) {
        const remaining = duration - player.currentTime;
        if (remaining < 3) {
          hasEnded.current = true;
          if (onProgress) onProgress(Math.floor(player.currentTime));
          onEnd();
        }
      }
    });

    return () => subscription.remove();
  }, [player, onEnd, onProgress, duration]);

  // Reset state saat url berubah (ganti lesson)
  useEffect(() => {
    hasEnded.current = false;
  }, [url]);

  const togglePlay = useCallback(() => {
    if (player.playing) {
      player.pause();
    } else {
      player.play();
    }
  }, [player]);

  if (!url) {
    return (
      <View style={styles.container}>
        <Ionicons name="videocam-off-outline" size={40} color="#71717A" />
        <Text style={styles.errorText}>Video tidak tersedia</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <VideoView
        player={player}
        style={styles.video}
        allowsFullscreen
        allowsPictureInPicture
        contentFit="contain"
        nativeControls
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  container: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#18181B',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  errorText: {
    color: '#71717A',
    fontSize: 14,
  },
});
