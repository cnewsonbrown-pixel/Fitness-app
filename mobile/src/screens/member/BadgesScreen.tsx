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
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card } from '../../components/common';
import { gamificationService, Badge } from '../../services/gamification.service';
import { RootStackParamList } from '../../types';

type BadgesScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

export const BadgesScreen: React.FC<BadgesScreenProps> = ({ navigation }) => {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'earned' | 'locked'>('all');

  useEffect(() => {
    fetchBadges();
  }, []);

  const fetchBadges = async () => {
    try {
      const data = await gamificationService.getAllBadges();
      setBadges(data);
    } catch (error) {
      console.error('Failed to fetch badges:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = useCallback(() => {
    setIsLoading(true);
    fetchBadges();
  }, []);

  const filteredBadges = badges.filter((badge) => {
    if (filter === 'earned') return badge.earnedAt;
    if (filter === 'locked') return !badge.earnedAt;
    return true;
  });

  const groupedBadges = filteredBadges.reduce((groups, badge) => {
    const category = badge.category || 'Other';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(badge);
    return groups;
  }, {} as Record<string, Badge[]>);

  const renderBadgeItem = ({ item }: { item: Badge }) => {
    const isEarned = !!item.earnedAt;

    return (
      <TouchableOpacity
        style={styles.badgeItem}
        onPress={() => setSelectedBadge(item)}
      >
        <View style={[styles.badgeIconContainer, !isEarned && styles.lockedBadge]}>
          {item.iconUrl ? (
            <Image
              source={{ uri: item.iconUrl }}
              style={[styles.badgeIcon, !isEarned && styles.lockedBadgeIcon]}
            />
          ) : (
            <Ionicons
              name="ribbon"
              size={32}
              color={isEarned ? '#6366f1' : '#94a3b8'}
            />
          )}
          {!isEarned && (
            <View style={styles.lockOverlay}>
              <Ionicons name="lock-closed" size={16} color="#fff" />
            </View>
          )}
        </View>
        <Text
          style={[styles.badgeName, !isEarned && styles.lockedBadgeName]}
          numberOfLines={2}
        >
          {item.name}
        </Text>
        {item.progress !== undefined && item.requirement && !isEarned && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${(item.progress / item.requirement) * 100}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {item.progress}/{item.requirement}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderCategory = ({ item }: { item: [string, Badge[]] }) => {
    const [category, categoryBadges] = item;

    return (
      <View style={styles.categorySection}>
        <Text style={styles.categoryTitle}>{category}</Text>
        <FlatList
          data={categoryBadges}
          renderItem={renderBadgeItem}
          keyExtractor={(badge) => badge.id}
          numColumns={3}
          scrollEnabled={false}
          contentContainerStyle={styles.badgesGrid}
        />
      </View>
    );
  };

  const renderBadgeModal = () => {
    if (!selectedBadge) return null;

    const isEarned = !!selectedBadge.earnedAt;

    return (
      <Modal
        visible={!!selectedBadge}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedBadge(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedBadge(null)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={styles.modalContent}
            onPress={(e) => e.stopPropagation()}
          >
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedBadge(null)}
            >
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>

            <View
              style={[
                styles.modalBadgeIcon,
                !isEarned && styles.modalLockedBadge,
              ]}
            >
              {selectedBadge.iconUrl ? (
                <Image
                  source={{ uri: selectedBadge.iconUrl }}
                  style={[
                    styles.modalBadgeImage,
                    !isEarned && styles.lockedBadgeIcon,
                  ]}
                />
              ) : (
                <Ionicons
                  name="ribbon"
                  size={64}
                  color={isEarned ? '#6366f1' : '#94a3b8'}
                />
              )}
            </View>

            <Text style={styles.modalBadgeName}>{selectedBadge.name}</Text>
            <Text style={styles.modalCategory}>{selectedBadge.category}</Text>

            <Text style={styles.modalDescription}>
              {selectedBadge.description}
            </Text>

            {isEarned && selectedBadge.earnedAt && (
              <View style={styles.earnedInfo}>
                <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                <Text style={styles.earnedText}>
                  Earned on {format(new Date(selectedBadge.earnedAt), 'MMMM d, yyyy')}
                </Text>
              </View>
            )}

            {!isEarned &&
              selectedBadge.progress !== undefined &&
              selectedBadge.requirement && (
                <View style={styles.modalProgress}>
                  <Text style={styles.modalProgressLabel}>Progress</Text>
                  <View style={styles.modalProgressBar}>
                    <View
                      style={[
                        styles.modalProgressFill,
                        {
                          width: `${(selectedBadge.progress / selectedBadge.requirement) * 100}%`,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.modalProgressText}>
                    {selectedBadge.progress} / {selectedBadge.requirement}
                  </Text>
                </View>
              )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    );
  };

  const earnedCount = badges.filter((b) => b.earnedAt).length;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.title}>Badges</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Stats */}
      <Card style={styles.statsCard}>
        <View style={styles.statItem}>
          <Ionicons name="ribbon" size={24} color="#6366f1" />
          <View>
            <Text style={styles.statValue}>
              {earnedCount} / {badges.length}
            </Text>
            <Text style={styles.statLabel}>Badges Earned</Text>
          </View>
        </View>
        <View style={styles.statProgress}>
          <View style={styles.statProgressBar}>
            <View
              style={[
                styles.statProgressFill,
                { width: `${(earnedCount / Math.max(badges.length, 1)) * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.statPercent}>
            {Math.round((earnedCount / Math.max(badges.length, 1)) * 100)}%
          </Text>
        </View>
      </Card>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        {(['all', 'earned', 'locked'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}
            onPress={() => setFilter(f)}
          >
            <Text
              style={[
                styles.filterTabText,
                filter === f && styles.filterTabTextActive,
              ]}
            >
              {f === 'all' ? 'All' : f === 'earned' ? 'Earned' : 'Locked'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Badges List */}
      <FlatList
        data={Object.entries(groupedBadges)}
        renderItem={renderCategory}
        keyExtractor={([category]) => category}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="ribbon-outline" size={64} color="#cbd5e1" />
              <Text style={styles.emptyText}>No badges found</Text>
            </View>
          ) : null
        }
      />

      {renderBadgeModal()}
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
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
  },
  placeholder: {
    width: 32,
  },
  statsCard: {
    margin: 16,
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  statProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statProgressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  statProgressFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 4,
  },
  statPercent: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
  },
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  filterTab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
  },
  filterTabActive: {
    backgroundColor: '#6366f1',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  filterTabTextActive: {
    color: '#fff',
  },
  listContent: {
    paddingBottom: 24,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  badgesGrid: {
    paddingHorizontal: 8,
  },
  badgeItem: {
    flex: 1,
    alignItems: 'center',
    padding: 8,
    margin: 4,
    maxWidth: '33%',
  },
  badgeIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#ede9fe',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  lockedBadge: {
    backgroundColor: '#f1f5f9',
  },
  badgeIcon: {
    width: 48,
    height: 48,
  },
  lockedBadgeIcon: {
    opacity: 0.4,
  },
  lockOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#94a3b8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1e293b',
    textAlign: 'center',
  },
  lockedBadgeName: {
    color: '#94a3b8',
  },
  progressContainer: {
    width: '100%',
    marginTop: 4,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 10,
    color: '#94a3b8',
    textAlign: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 48,
  },
  emptyText: {
    fontSize: 16,
    color: '#94a3b8',
    marginTop: 16,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 4,
  },
  modalBadgeIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#ede9fe',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalLockedBadge: {
    backgroundColor: '#f1f5f9',
  },
  modalBadgeImage: {
    width: 64,
    height: 64,
  },
  modalBadgeName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 4,
  },
  modalCategory: {
    fontSize: 12,
    color: '#6366f1',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  modalDescription: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  earnedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#dcfce7',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  earnedText: {
    fontSize: 12,
    color: '#16a34a',
    fontWeight: '500',
  },
  modalProgress: {
    width: '100%',
  },
  modalProgressLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 8,
  },
  modalProgressBar: {
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  modalProgressFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 4,
  },
  modalProgressText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
});
