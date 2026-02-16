import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card } from '../../components/common';
import { memberService } from '../../services/member.service';
import { Article, Announcement, RootStackParamList } from '../../types';

type ContentFeedScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

type ContentItem =
  | { type: 'announcement'; data: Announcement }
  | { type: 'article'; data: Article };

export const ContentFeedScreen: React.FC<ContentFeedScreenProps> = ({ navigation }) => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const categories = ['All', 'Fitness', 'Nutrition', 'Wellness', 'Tips'];

  useEffect(() => {
    fetchContent();
  }, [selectedCategory]);

  const fetchContent = async (refresh = false) => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      const currentPage = refresh ? 1 : page;
      const response = await memberService.getArticles({
        category: selectedCategory === 'All' ? undefined : selectedCategory || undefined,
        page: currentPage,
        limit: 10,
      });

      if (refresh) {
        setArticles(response.data);
        setPage(2);
      } else {
        setArticles((prev) => [...prev, ...response.data]);
        setPage((prev) => prev + 1);
      }

      setHasMore(response.data.length === 10);
    } catch (error) {
      console.error('Failed to fetch content:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = useCallback(() => {
    fetchContent(true);
  }, [selectedCategory]);

  const loadMore = () => {
    if (hasMore && !isLoading) {
      fetchContent();
    }
  };

  const getAnnouncementIcon = (type: Announcement['type']) => {
    switch (type) {
      case 'URGENT':
        return 'warning';
      case 'WARNING':
        return 'alert-circle';
      case 'CELEBRATION':
        return 'sparkles';
      default:
        return 'information-circle';
    }
  };

  const getAnnouncementColor = (type: Announcement['type']) => {
    switch (type) {
      case 'URGENT':
        return '#ef4444';
      case 'WARNING':
        return '#f59e0b';
      case 'CELEBRATION':
        return '#8b5cf6';
      default:
        return '#6366f1';
    }
  };

  const renderAnnouncement = (announcement: Announcement) => (
    <Card
      key={announcement.id}
      style={[
        styles.announcementCard,
        { borderLeftColor: getAnnouncementColor(announcement.type) },
      ]}
    >
      <View style={styles.announcementHeader}>
        <Ionicons
          name={getAnnouncementIcon(announcement.type)}
          size={20}
          color={getAnnouncementColor(announcement.type)}
        />
        <Text style={styles.announcementTitle}>{announcement.title}</Text>
      </View>
      <Text style={styles.announcementContent}>{announcement.content}</Text>
      <Text style={styles.announcementDate}>
        {format(new Date(announcement.publishedAt), 'MMM d, yyyy')}
      </Text>
    </Card>
  );

  const renderArticle = ({ item }: { item: Article }) => (
    <Card
      variant="elevated"
      style={styles.articleCard}
      onPress={() => navigation.navigate('ArticleDetails', { articleId: item.id })}
    >
      {item.coverImageUrl && (
        <Image source={{ uri: item.coverImageUrl }} style={styles.articleImage} />
      )}
      <View style={styles.articleContent}>
        <View style={styles.articleMeta}>
          <Text style={styles.articleCategory}>{item.category}</Text>
          <Text style={styles.articleDate}>
            {format(new Date(item.publishedAt), 'MMM d')}
          </Text>
        </View>
        <Text style={styles.articleTitle}>{item.title}</Text>
        {item.excerpt && (
          <Text style={styles.articleExcerpt} numberOfLines={2}>
            {item.excerpt}
          </Text>
        )}
        <View style={styles.articleFooter}>
          <View style={styles.articleTags}>
            {item.tags.slice(0, 2).map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity
            onPress={async () => {
              if (item.isBookmarked) {
                await memberService.unbookmarkArticle(item.id);
              } else {
                await memberService.bookmarkArticle(item.id);
              }
              // Refresh the article
              fetchContent(true);
            }}
          >
            <Ionicons
              name={item.isBookmarked ? 'bookmark' : 'bookmark-outline'}
              size={20}
              color={item.isBookmarked ? '#6366f1' : '#94a3b8'}
            />
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  );

  const renderHeader = () => (
    <View>
      {/* Announcements */}
      {announcements.length > 0 && (
        <View style={styles.announcementsSection}>
          {announcements.map(renderAnnouncement)}
        </View>
      )}

      {/* Category Filter */}
      <FlatList
        horizontal
        data={categories}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesContainer}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.categoryChip,
              (selectedCategory === item || (item === 'All' && !selectedCategory)) &&
                styles.categoryChipActive,
            ]}
            onPress={() => setSelectedCategory(item === 'All' ? null : item)}
          >
            <Text
              style={[
                styles.categoryChipText,
                (selectedCategory === item || (item === 'All' && !selectedCategory)) &&
                  styles.categoryChipTextActive,
              ]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        )}
      />

      <Text style={styles.sectionTitle}>Latest Articles</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Content</Text>
        <TouchableOpacity onPress={() => {}}>
          <Ionicons name="bookmarks-outline" size={24} color="#1e293b" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={articles}
        renderItem={renderArticle}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isLoading && page === 1} onRefresh={onRefresh} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={64} color="#cbd5e1" />
              <Text style={styles.emptyText}>No articles yet</Text>
              <Text style={styles.emptySubtext}>Check back soon for new content</Text>
            </View>
          ) : null
        }
      />
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
  listContent: {
    paddingBottom: 24,
  },
  announcementsSection: {
    padding: 16,
    paddingBottom: 8,
  },
  announcementCard: {
    marginBottom: 8,
    borderLeftWidth: 4,
    paddingLeft: 12,
  },
  announcementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  announcementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
  },
  announcementContent: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  announcementDate: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 8,
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  articleCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    overflow: 'hidden',
    padding: 0,
  },
  articleImage: {
    width: '100%',
    height: 160,
    backgroundColor: '#e2e8f0',
  },
  articleContent: {
    padding: 16,
  },
  articleMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  articleCategory: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6366f1',
    textTransform: 'uppercase',
  },
  articleDate: {
    fontSize: 12,
    color: '#94a3b8',
  },
  articleTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  articleExcerpt: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  articleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  articleTags: {
    flexDirection: 'row',
    gap: 8,
  },
  tag: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 12,
    color: '#64748b',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
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
});
