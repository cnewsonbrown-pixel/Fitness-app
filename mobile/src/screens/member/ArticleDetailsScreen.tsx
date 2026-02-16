import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  TouchableOpacity,
  Share,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { memberService } from '../../services/member.service';
import { Article, RootStackParamList } from '../../types';

type ArticleDetailsScreenProps = NativeStackScreenProps<RootStackParamList, 'ArticleDetails'>;

export const ArticleDetailsScreen: React.FC<ArticleDetailsScreenProps> = ({
  navigation,
  route,
}) => {
  const { articleId } = route.params;
  const [article, setArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    fetchArticle();
  }, [articleId]);

  const fetchArticle = async () => {
    try {
      const response = await memberService.getArticle(articleId);
      setArticle(response);
      setIsBookmarked(response.isBookmarked || false);
    } catch (error) {
      console.error('Failed to fetch article:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookmark = async () => {
    if (!article) return;

    try {
      if (isBookmarked) {
        await memberService.unbookmarkArticle(article.id);
      } else {
        await memberService.bookmarkArticle(article.id);
      }
      setIsBookmarked(!isBookmarked);
    } catch (error) {
      console.error('Failed to toggle bookmark:', error);
    }
  };

  const handleShare = async () => {
    if (!article) return;

    try {
      await Share.share({
        title: article.title,
        message: `Check out this article: ${article.title}`,
      });
    } catch (error) {
      console.error('Failed to share:', error);
    }
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

  if (!article) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#cbd5e1" />
          <Text style={styles.errorText}>Article not found</Text>
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
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleBookmark} style={styles.headerButton}>
            <Ionicons
              name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
              size={24}
              color={isBookmarked ? '#6366f1' : '#1e293b'}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare} style={styles.headerButton}>
            <Ionicons name="share-outline" size={24} color="#1e293b" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Cover Image */}
        {article.coverImageUrl && (
          <Image
            source={{ uri: article.coverImageUrl }}
            style={styles.coverImage}
          />
        )}

        <View style={styles.articleContent}>
          {/* Category & Date */}
          <View style={styles.meta}>
            <Text style={styles.category}>{article.category}</Text>
            <Text style={styles.date}>
              {format(new Date(article.publishedAt), 'MMMM d, yyyy')}
            </Text>
          </View>

          {/* Title */}
          <Text style={styles.title}>{article.title}</Text>

          {/* Author */}
          {article.author && (
            <View style={styles.authorSection}>
              {article.author.avatarUrl ? (
                <Image
                  source={{ uri: article.author.avatarUrl }}
                  style={styles.authorAvatar}
                />
              ) : (
                <View style={styles.authorAvatarPlaceholder}>
                  <Ionicons name="person" size={16} color="#94a3b8" />
                </View>
              )}
              <View>
                <Text style={styles.authorName}>{article.author.name}</Text>
                {article.readTime && (
                  <Text style={styles.readTime}>{article.readTime} min read</Text>
                )}
              </View>
            </View>
          )}

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <View style={styles.tagsSection}>
              {article.tags.map((tag) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Article Body */}
          <View style={styles.bodySection}>
            <Text style={styles.bodyText}>{article.content}</Text>
          </View>

          {/* Related Articles */}
          {article.relatedArticles && article.relatedArticles.length > 0 && (
            <View style={styles.relatedSection}>
              <Text style={styles.relatedTitle}>Related Articles</Text>
              {article.relatedArticles.map((related) => (
                <TouchableOpacity
                  key={related.id}
                  style={styles.relatedCard}
                  onPress={() =>
                    navigation.push('ArticleDetails', { articleId: related.id })
                  }
                >
                  {related.coverImageUrl && (
                    <Image
                      source={{ uri: related.coverImageUrl }}
                      style={styles.relatedImage}
                    />
                  )}
                  <View style={styles.relatedContent}>
                    <Text style={styles.relatedCategory}>{related.category}</Text>
                    <Text style={styles.relatedArticleTitle} numberOfLines={2}>
                      {related.title}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
    padding: 8,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  content: {
    flex: 1,
  },
  coverImage: {
    width: '100%',
    height: 240,
    backgroundColor: '#e2e8f0',
  },
  articleContent: {
    padding: 20,
  },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  category: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6366f1',
    textTransform: 'uppercase',
  },
  date: {
    fontSize: 12,
    color: '#94a3b8',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    lineHeight: 36,
    marginBottom: 16,
  },
  authorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  authorAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  readTime: {
    fontSize: 12,
    color: '#94a3b8',
  },
  tagsSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  tag: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  bodySection: {
    marginBottom: 32,
  },
  bodyText: {
    fontSize: 16,
    color: '#334155',
    lineHeight: 26,
  },
  relatedSection: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 24,
  },
  relatedTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  relatedCard: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    overflow: 'hidden',
  },
  relatedImage: {
    width: 80,
    height: 80,
    backgroundColor: '#e2e8f0',
  },
  relatedContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  relatedCategory: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6366f1',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  relatedArticleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
});
