import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Video as ExpoVideo, ResizeMode, AVPlaybackStatus } from 'expo-av';
import * as ScreenOrientation from 'expo-screen-orientation';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Card } from '../../components/common';
import { videoService, Video } from '../../services/video.service';
import { RootStackParamList } from '../../types';

type VideoPlayerScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'VideoPlayer'
>;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const VideoPlayerScreen: React.FC<VideoPlayerScreenProps> = ({
  navigation,
  route,
}) => {
  const { videoId } = route.params;
  const videoRef = useRef<ExpoVideo>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  const [video, setVideo] = useState<Video | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);

  useEffect(() => {
    fetchVideo();

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
      // Reset orientation when leaving
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    };
  }, [videoId]);

  // Auto-hide controls
  useEffect(() => {
    let timeout: NodeJS.Timeout;

    if (showControls && isPlaying) {
      timeout = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [showControls, isPlaying]);

  const fetchVideo = async () => {
    try {
      const data = await videoService.getVideo(videoId);
      setVideo(data);

      // Resume from last position if available
      if (data.watchedSeconds && data.watchedSeconds > 0) {
        setPosition(data.watchedSeconds * 1000);
      }
    } catch (error) {
      console.error('Failed to fetch video:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlaybackStatusUpdate = useCallback(
    (status: AVPlaybackStatus) => {
      if (!status.isLoaded) return;

      setPosition(status.positionMillis);
      setDuration(status.durationMillis || 0);
      setIsPlaying(status.isPlaying);

      // Mark as complete if watched 90%
      if (
        status.durationMillis &&
        status.positionMillis >= status.durationMillis * 0.9 &&
        video &&
        !video.isCompleted
      ) {
        videoService.markComplete(videoId);
      }
    },
    [video, videoId]
  );

  const togglePlayPause = async () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      await videoRef.current.pauseAsync();
    } else {
      await videoRef.current.playAsync();
    }
  };

  const seekTo = async (millis: number) => {
    if (!videoRef.current) return;

    await videoRef.current.setPositionAsync(millis);
  };

  const skipForward = async () => {
    const newPosition = Math.min(position + 10000, duration);
    await seekTo(newPosition);
  };

  const skipBackward = async () => {
    const newPosition = Math.max(position - 10000, 0);
    await seekTo(newPosition);
  };

  const toggleFullscreen = async () => {
    if (isFullscreen) {
      await ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.PORTRAIT_UP
      );
    } else {
      await ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.LANDSCAPE
      );
    }
    setIsFullscreen(!isFullscreen);
  };

  const saveProgress = useCallback(async () => {
    if (video && position > 0) {
      try {
        await videoService.updateProgress(videoId, Math.floor(position / 1000));
      } catch (error) {
        console.error('Failed to save progress:', error);
      }
    }
  }, [video, position, videoId]);

  // Save progress periodically
  useEffect(() => {
    progressInterval.current = setInterval(saveProgress, 10000); // Every 10 seconds

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
      // Save on unmount
      saveProgress();
    };
  }, [saveProgress]);

  const formatTime = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      </SafeAreaView>
    );
  }

  if (!video) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#cbd5e1" />
          <Text style={styles.errorText}>Video not found</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const videoSource = video.vimeoUrl
    ? { uri: video.vimeoUrl }
    : video.vimeoId
    ? { uri: `https://player.vimeo.com/video/${video.vimeoId}` }
    : null;

  return (
    <View style={[styles.container, isFullscreen && styles.fullscreenContainer]}>
      <StatusBar hidden={isFullscreen} />

      {/* Video Player */}
      <TouchableOpacity
        activeOpacity={1}
        style={[
          styles.videoContainer,
          isFullscreen && styles.fullscreenVideo,
        ]}
        onPress={() => setShowControls(!showControls)}
      >
        {videoSource ? (
          <ExpoVideo
            ref={videoRef}
            source={videoSource}
            style={styles.video}
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay={false}
            positionMillis={video.watchedSeconds ? video.watchedSeconds * 1000 : 0}
            onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
            useNativeControls={false}
          />
        ) : (
          <View style={styles.videoPlaceholder}>
            <Ionicons name="videocam-off" size={64} color="#94a3b8" />
            <Text style={styles.videoPlaceholderText}>Video unavailable</Text>
          </View>
        )}

        {/* Custom Controls */}
        {showControls && videoSource && (
          <View style={styles.controlsOverlay}>
            {/* Top Bar */}
            {!isFullscreen && (
              <View style={styles.topBar}>
                <TouchableOpacity
                  onPress={() => {
                    saveProgress();
                    navigation.goBack();
                  }}
                  style={styles.closeButton}
                >
                  <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            )}

            {/* Center Controls */}
            <View style={styles.centerControls}>
              <TouchableOpacity onPress={skipBackward} style={styles.skipButton}>
                <Ionicons name="play-back" size={32} color="#fff" />
                <Text style={styles.skipText}>10s</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={togglePlayPause}
                style={styles.playButton}
              >
                <Ionicons
                  name={isPlaying ? 'pause' : 'play'}
                  size={48}
                  color="#fff"
                />
              </TouchableOpacity>

              <TouchableOpacity onPress={skipForward} style={styles.skipButton}>
                <Ionicons name="play-forward" size={32} color="#fff" />
                <Text style={styles.skipText}>10s</Text>
              </TouchableOpacity>
            </View>

            {/* Bottom Bar */}
            <View style={styles.bottomBar}>
              <Text style={styles.timeText}>{formatTime(position)}</Text>

              <View style={styles.progressBarContainer}>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${duration > 0 ? (position / duration) * 100 : 0}%` },
                    ]}
                  />
                </View>
              </View>

              <Text style={styles.timeText}>{formatTime(duration)}</Text>

              <TouchableOpacity
                onPress={toggleFullscreen}
                style={styles.fullscreenButton}
              >
                <Ionicons
                  name={isFullscreen ? 'contract' : 'expand'}
                  size={24}
                  color="#fff"
                />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </TouchableOpacity>

      {/* Video Info - Hidden in fullscreen */}
      {!isFullscreen && (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.videoInfo}>
            <View style={styles.levelContainer}>
              <View
                style={[
                  styles.levelBadge,
                  { backgroundColor: getLevelColor(video.level) },
                ]}
              >
                <Text style={styles.levelText}>{video.level}</Text>
              </View>
              {video.isPremium && (
                <View style={styles.premiumBadge}>
                  <Ionicons name="star" size={12} color="#f59e0b" />
                  <Text style={styles.premiumText}>Premium</Text>
                </View>
              )}
            </View>

            <Text style={styles.videoTitle}>{video.title}</Text>

            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={16} color="#64748b" />
                <Text style={styles.metaText}>
                  {Math.floor(video.duration / 60)} min
                </Text>
              </View>
            </View>

            <Text style={styles.description}>{video.description}</Text>
          </View>

          <View style={styles.bottomPadding} />
        </ScrollView>
      )}
    </View>
  );
};

const getLevelColor = (level: string) => {
  switch (level) {
    case 'BEGINNER':
      return '#10b981';
    case 'INTERMEDIATE':
      return '#f59e0b';
    case 'ADVANCED':
      return '#ef4444';
    default:
      return '#6366f1';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  fullscreenContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 16,
  },
  backButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#6366f1',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  videoContainer: {
    width: '100%',
    height: SCREEN_WIDTH * (9 / 16),
    backgroundColor: '#000',
    position: 'relative',
  },
  fullscreenVideo: {
    height: '100%',
    width: '100%',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  videoPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e293b',
  },
  videoPlaceholderText: {
    color: '#94a3b8',
    marginTop: 12,
    fontSize: 16,
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 48 : 16,
  },
  closeButton: {
    padding: 8,
  },
  centerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 48,
  },
  skipButton: {
    alignItems: 'center',
  },
  skipText: {
    color: '#fff',
    fontSize: 10,
    marginTop: 2,
  },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(99, 102, 241, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 24,
    gap: 12,
  },
  timeText: {
    color: '#fff',
    fontSize: 12,
    fontVariant: ['tabular-nums'],
    minWidth: 40,
  },
  progressBarContainer: {
    flex: 1,
    height: 24,
    justifyContent: 'center',
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 2,
  },
  fullscreenButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  videoInfo: {
    padding: 16,
  },
  levelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  levelBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  levelText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
    textTransform: 'uppercase',
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fef3c7',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  premiumText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#f59e0b',
  },
  videoTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 14,
    color: '#64748b',
  },
  description: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 22,
  },
  bottomPadding: {
    height: 24,
  },
});
