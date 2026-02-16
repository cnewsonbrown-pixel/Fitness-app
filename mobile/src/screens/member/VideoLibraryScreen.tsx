import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card } from '../../components/common';
import { videoService, VideoProgram, Video } from '../../services/video.service';
import { RootStackParamList } from '../../types';

type VideoLibraryScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

export const VideoLibraryScreen: React.FC<VideoLibraryScreenProps> = ({
  navigation,
}) => {
  const [programs, setPrograms] = useState<VideoProgram[]>([]);
  const [continueWatching, setContinueWatching] = useState<Video[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [selectedCategory]);

  const fetchData = async () => {
    try {
      const [programsData, continueData, categoriesData] = await Promise.all([
        videoService.getPrograms({
          category: selectedCategory || undefined,
        }),
        videoService.getContinueWatching(),
        videoService.getCategories(),
      ]);

      setPrograms(programsData);
      setContinueWatching(continueData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Failed to fetch video library:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = useCallback(() => {
    setIsLoading(true);
    fetchData();
  }, [selectedCategory]);

  const formatDuration = (minutes: number) => {
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

  const renderContinueWatchingItem = ({ item }: { item: Video }) => {
    const progressPercent = item.watchedSeconds
      ? Math.round((item.watchedSeconds / item.duration) * 100)
      : 0;

    return (
      <TouchableOpacity
        style={styles.continueCard}
        onPress={() => navigation.navigate('VideoPlayer', { videoId: item.id })}
      >
        <View style={styles.continueThumbnailContainer}>
          {item.thumbnailUrl ? (
            <Image
              source={{ uri: item.thumbnailUrl }}
              style={styles.continueThumbnail}
            />
          ) : (
            <View style={styles.continueThumbnailPlaceholder}>
              <Ionicons name="play-circle" size={32} color="#fff" />
            </View>
          )}
          <View style={styles.playOverlay}>
            <Ionicons name="play" size={24} color="#fff" />
          </View>
          <View style={styles.continueProgressBar}>
            <View
              style={[styles.continueProgressFill, { width: `${progressPercent}%` }]}
            />
          </View>
        </View>
        <Text style={styles.continueTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.continueDuration}>
          {Math.floor((item.duration - (item.watchedSeconds || 0)) / 60)} min left
        </Text>
      </TouchableOpacity>
    );
  };

  const renderProgramCard = ({ item }: { item: VideoProgram }) => {
    const progressPercent = item.progress || 0;

    return (
      <Card
        variant="elevated"
        style={styles.programCard}
        onPress={() =>
          navigation.navigate('VideoProgram', { programId: item.id })
        }
      >
        <View style={styles.programThumbnailContainer}>
          {item.thumbnailUrl ? (
            <Image
              source={{ uri: item.thumbnailUrl }}
              style={styles.programThumbnail}
            />
          ) : (
            <View style={styles.programThumbnailPlaceholder}>
              <Ionicons name="videocam" size={48} color="#6366f1" />
            </View>
          )}
          <View
            style={[
              styles.levelBadge,
              { backgroundColor: getLevelColor(item.level) },
            ]}
          >
            <Text style={styles.levelText}>{item.level}</Text>
          </View>
        </View>

        <View style={styles.programContent}>
          <Text style={styles.programCategory}>{item.category}</Text>
          <Text style={styles.programName}>{item.name}</Text>
          <Text style={styles.programDescription} numberOfLines={2}>
            {item.description}
          </Text>

          <View style={styles.programMeta}>
            <View style={styles.programMetaItem}>
              <Ionicons name="videocam-outline" size={14} color="#64748b" />
              <Text style={styles.programMetaText}>
                {item.totalVideos} videos
              </Text>
            </View>
            <View style={styles.programMetaItem}>
              <Ionicons name="time-outline" size={14} color="#64748b" />
              <Text style={styles.programMetaText}>
                {formatDuration(item.totalDuration)}
              </Text>
            </View>
          </View>

          {progressPercent > 0 && (
            <View style={styles.programProgress}>
              <View style={styles.progressBar}>
                <View
                  style={[styles.progressFill, { width: `${progressPercent}%` }]}
                />
              </View>
              <Text style={styles.progressText}>{progressPercent}% complete</Text>
            </View>
          )}
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Video Library</Text>
        <TouchableOpacity onPress={() => {}}>
          <Ionicons name="search-outline" size={24} color="#1e293b" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Continue Watching */}
        {continueWatching.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Continue Watching</Text>
            <FlatList
              horizontal
              data={continueWatching}
              renderItem={renderContinueWatchingItem}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            />
          </View>
        )}

        {/* Category Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        >
          <TouchableOpacity
            style={[
              styles.categoryChip,
              !selectedCategory && styles.categoryChipActive,
            ]}
            onPress={() => setSelectedCategory(null)}
          >
            <Text
              style={[
                styles.categoryChipText,
                !selectedCategory && styles.categoryChipTextActive,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryChip,
                selectedCategory === category && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  selectedCategory === category && styles.categoryChipTextActive,
                ]}
              >
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Programs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Programs</Text>
          {programs.map((program) => (
            <View key={program.id}>
              {renderProgramCard({ item: program })}
            </View>
          ))}

          {programs.length === 0 && !isLoading && (
            <View style={styles.emptyContainer}>
              <Ionicons name="videocam-outline" size={64} color="#cbd5e1" />
              <Text style={styles.emptyText}>No programs found</Text>
              <Text style={styles.emptySubtext}>
                Check back soon for new content
              </Text>
            </View>
          )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    paddingHorizontal: 16,
    marginBottom: 12,
    marginTop: 16,
  },
  horizontalList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  continueCard: {
    width: 160,
    marginRight: 12,
  },
  continueThumbnailContainer: {
    width: '100%',
    height: 90,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 8,
  },
  continueThumbnail: {
    width: '100%',
    height: '100%',
  },
  continueThumbnailPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -16 }, { translateY: -16 }],
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueProgressBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  continueProgressFill: {
    height: '100%',
    backgroundColor: '#6366f1',
  },
  continueTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1e293b',
    marginBottom: 4,
  },
  continueDuration: {
    fontSize: 11,
    color: '#94a3b8',
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  categoryChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: '#6366f1',
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  categoryChipTextActive: {
    color: '#fff',
  },
  programCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 0,
    overflow: 'hidden',
  },
  programThumbnailContainer: {
    width: '100%',
    height: 160,
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
  levelBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
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
  programContent: {
    padding: 16,
  },
  programCategory: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6366f1',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  programName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  programDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 12,
  },
  programMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  programMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  programMetaText: {
    fontSize: 12,
    color: '#64748b',
  },
  programProgress: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#6366f1',
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 48,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 8,
  },
  bottomPadding: {
    height: 24,
  },
});
