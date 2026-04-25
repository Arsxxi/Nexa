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
  onDurationChange?: (actualDuration: number) => void;
}

export function VideoPlayer({
  url,
  lessonId,
  userId,
  duration,
  onEnd,
  onProgress,
  onDurationChange,
}: VideoPlayerProps) {
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasEnded = useRef(false);
  const actualDurationRef = useRef(duration);

  const player = useVideoPlayer(url, (p) => {
    p.loop = false;
    p.play();
  });

  // Try to get actual duration from player (for cloud videos)
  useEffect(() => {
    const getActualDuration = () => {
      if (!player) return;
      
      // Try to get duration from player (works for cloud/local videos)
      if (player.duration && player.duration > 0 && player.duration !== actualDurationRef.current) {
        actualDurationRef.current = player.duration;
        console.log('[VideoPlayer] Got actual duration from player:', player.duration);
        if (onDurationChange) {
          onDurationChange(player.duration);
        }
      }
    };

    // Poll duration for first 3 seconds (video needs time to load)
    const durationPollInterval = setInterval(getActualDuration, 500);
    setTimeout(() => clearInterval(durationPollInterval), 3000);

    return () => clearInterval(durationPollInterval);
  }, [player, onDurationChange]);

  // Track progress every 1 second for accuracy
  useEffect(() => {
    if (!onProgress) return;

    const trackProgress = () => {
      if (player && player.currentTime > 0 && !hasEnded.current) {
        const currentSeconds = Math.floor(player.currentTime);
        onProgress(currentSeconds);

        // Auto-end if >= 95% of actual duration
        const progressPercent = (currentSeconds / actualDurationRef.current) * 100;
        if (progressPercent >= 95 && !hasEnded.current) {
          hasEnded.current = true;
          console.log('[VideoPlayer] Video ended (95%+), calling onEnd');
          onEnd?.();
        }
      }
    };

    progressInterval.current = setInterval(trackProgress, 1000);

    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, [player, onProgress, onEnd]);

  // Multiple methods for video end detection - more reliable
  useEffect(() => {
    if (!onEnd) return;

    const checkVideoEnd = () => {
      if (hasEnded.current || !player.currentTime) return;
      
      const currentDuration = actualDurationRef.current;
      const remaining = currentDuration - player.currentTime;
      const progressPercent = (player.currentTime / currentDuration) * 100;
      
      // Video considered done if: remaining < 3 seconds OR progress >= 95%
      if (remaining < 3 || progressPercent >= 95) {
        hasEnded.current = true;
        console.log('[VideoPlayer] Video ended, calling onEnd. progress:', progressPercent.toFixed(1));
        onProgress?.(Math.floor(player.currentTime));
        onEnd();
      }
    };

    // Method 1: playingChange event
    const subscription = player.addListener('playingChange', (isPlaying) => {
      console.log('[VideoPlayer] playingChange:', isPlaying, 'currentTime:', player.currentTime?.toFixed(1));
      if (!isPlaying && !hasEnded.current && player.currentTime > 0) {
        checkVideoEnd();
      }
    });

    // Method 2: Periodic check every 2 seconds as backup
    const timeCheckInterval = setInterval(() => {
      if (!hasEnded.current && player.currentTime > 0) {
        checkVideoEnd();
      }
    }, 2000);

    return () => {
      subscription.remove();
      if (timeCheckInterval) clearInterval(timeCheckInterval);
    };
  }, [player, onEnd, onProgress]);

  // Reset state when url changes (new lesson)
  useEffect(() => {
    hasEnded.current = false;
    actualDurationRef.current = duration;
  }, [url, duration]);

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
