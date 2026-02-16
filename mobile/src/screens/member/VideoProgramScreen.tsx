import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Card } from '../../components/common';
import { videoService, VideoProgram, Video } from '../../services/video.service';
import { RootStackParamList } from '../../types';

type VideoProgramScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'VideoProgram'
>;

export const VideoProgramScreen: React.FC<VideoProgramScreenProps> = ({
  navigation,
  route,
}) => {
  const { programId } = route.params;
  const [program, setProgram] = useState<VideoProgram | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProgram();
  }, [programId]);

  const fetchProgram = async () => {
    try {
      const [programData, videosData] = await Promise.all([
        videoService.getProgram(programId),
        videoService.getProgramVideos(programId),
      ]);

      setProgram(programData);
      setVideos(videosData);
    } catch (error) {
      console.error('Failed to fetch program:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = useCallback(() => {
    setIsLoading(true);
    fetchProgram();
  }, [programId]);

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
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

  const getNextVideo = () => {
    // Find the first uncompleted video or the first one if all are complete
    const nextUncompleted = videos.find((v) => !v.isCompleted);
    return nextUncompleted || videos[0];
  };

  const renderVideoItem = ({ item, index }: { item: Video; index: number }) => {
    const progressPercent = item.watchedSeconds
      ? Math.round((item.watchedSeconds / item.duration) * 100)
      : 0;

    return (
      <TouchableOpacity
        style={[styles.videoItem, item.isCompleted && styles.completedVideoItem]}
        onPress={() => navigation.navigate('VideoPlayer', { videoId: item.id })}
      >
        <View style={styles.videoNumber}>
          {item.isCompleted ? (
            <Ionicons name="checkmark-circle" size={24} color="#10b981" />
          ) : (
            <Text style={styles.videoNumberText}>{index + 1}</Text>
          )}
        </View>

        <View style={styles.videoThumbnailContainer}>
          {item.thumbnailUrl ? (
            <Image source={{ uri: item.thumbnailUrl }} style={styles.videoThumbnail} />
          ) : (
            <View style={styles.videoThumbnailPlaceholder}>
              <Ionicons name="play-circle" size={24} color="#6366f1" />
            </View>
          )}
          {item.isPremium && (
            <View style={styles.premiumBadge}>
              <Ionicons name="star" size={10} color="#f59e0b" />
            </View>
          )}
        </View>

        <View style={styles.videoInfo}>
          <Text style={styles.videoTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <View style={styles.videoMeta}>
            <Text style={styles.videoDuration}>
              {formatDuration(item.duration)}
            </Text>
            {progressPercent > 0 && !item.isCompleted && (
              <Text style={styles.videoProgress}>{progressPercent}% watched</Text>
            )}
          </View>
        </View>

        <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
      </TouchableOpacity>
    );
  };

  if (isLoading && !program) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!program) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#cbd5e1" />
          <Text style={styles.errorText}>Program not found</Text>
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

  const completedCount = videos.filter((v) => v.isCompleted).length;
  const progressPercent = videos.length > 0 ? Math.round((completedCount / videos.length) * 100) : 0;
  const nextVideo = getNextVideo();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
        >
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Program</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Program Header */}
        <View style={styles.programHeader}>
          {program.thumbnailUrl ? (
            <Image
              source={{ uri: program.thumbnailUrl }}
              style={styles.programThumbnail}
            />
          ) : (
            <View style={styles.programThumbnailPlaceholder}>
              <Ionicons name="videocam" size={64} color="#6366f1" />
            </View>
          )}

          <View style={styles.programOverlay}>
            <View
              style={[
                styles.levelBadge,
                { backgroundColor: getLevelColor(program.level) },
              ]}
            >
              <Text style={styles.levelText}>{program.level}</Text>
            </View>
          </View>
        </View>

        {/* Program Info */}
        <View style={styles.programInfo}>
          <Text style={styles.programCategory}>{program.category}</Text>
          <Text style={styles.programName}>{program.name}</Text>
          <Text style={styles.programDescription}>{program.description}</Text>

          <View style={styles.programStats}>
            <View style={styles.statItem}>
              <Ionicons name="videocam-outline" size={18} color="#64748b" />
              <Text style={styles.statText}>{program.totalVideos} videos</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="time-outline" size={18} color="#64748b" />
              <Text style={styles.statText}>
                {formatDuration(program.totalDuration * 60)}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="checkmark-done-outline" size={18} color="#64748b" />
              <Text style={styles.statText}>
                {completedCount}/{videos.length} complete
              </Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Your Progress</Text>
              <Text style={styles.progressPercent}>{progressPercent}%</Text>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[styles.progressFill, { width: `${progressPercent}%` }]}
              />
            </View>
          </View>

          {/* Continue Button */}
          {nextVideo && (
            <TouchableOpacity
              style={styles.continueButton}
              onPress={() =>
                navigation.navigate('VideoPlayer', { videoId: nextVideo.id })
              }
            >
              <Ionicons name="play-circle" size={24} color="#fff" />
              <Text style={styles.continueButtonText}>
                {completedCount === 0
                  ? 'Start Program'
                  : completedCount === videos.length
                  ? 'Watch Again'
                  : 'Continue Watching'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Videos List */}
        <View style={styles.videosSection}>
          <Text style={styles.sectionTitle}>Videos</Text>
          {videos.map((video, index) => (
            <View key={video.id}>{renderVideoItem({ item: video, index })}</View>
          ))}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  programHeader: {
    height: 200,
    position: 'relative',
  },
  programThumbnail: {
    width: '100%',
    height: '100%',
  },
  programThumbnailPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#ede9fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  programOverlay: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  levelBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  levelText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
    textTransform: 'uppercase',
  },
  programInfo: {
    padding: 16,
    backgroundColor: '#fff',
  },
  programCategory: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6366f1',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  programName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  programDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 22,
    marginBottom: 16,
  },
  programStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 20,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    color: '#64748b',
  },
  progressSection: {
    marginBottom: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 4,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#6366f1',
    paddingVertical: 14,
    borderRadius: 12,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  videosSection: {
    padding: 16,
    paddingTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  videoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 8,
  },
  completedVideoItem: {
    backgroundColor: '#f0fdf4',
  },
  videoNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  videoNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  videoThumbnailContainer: {
    width: 80,
    height: 50,
    borderRadius: 6,
    overflow: 'hidden',
    marginRight: 12,
    position: 'relative',
  },
  videoThumbnail: {
    width: '100%',
    height: '100%',
  },
  videoThumbnailPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#ede9fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#fef3c7',
    padding: 2,
    borderRadius: 4,
  },
  videoInfo: {
    flex: 1,
  },
  videoTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
    marginBottom: 4,
  },
  videoMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  videoDuration: {
    fontSize: 12,
    color: '#94a3b8',
  },
  videoProgress: {
    fontSize: 12,
    color: '#6366f1',
  },
  bottomPadding: {
    height: 24,
  },
});
