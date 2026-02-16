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
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card } from '../../components/common';
import {
  gamificationService,
  LeaderboardEntry,
} from '../../services/gamification.service';
import { RootStackParamList } from '../../types';

type LeaderboardScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

type Period = 'weekly' | 'monthly' | 'allTime';

export const LeaderboardScreen: React.FC<LeaderboardScreenProps> = ({
  navigation,
}) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [period, setPeriod] = useState<Period>('weekly');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, [period]);

  const fetchLeaderboard = async () => {
    try {
      const data = await gamificationService.getLeaderboard({ period, limit: 100 });
      setLeaderboard(data);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = useCallback(() => {
    setIsLoading(true);
    fetchLeaderboard();
  }, [period]);

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return { color: '#f59e0b', icon: 'trophy' as const };
      case 2:
        return { color: '#94a3b8', icon: 'medal' as const };
      case 3:
        return { color: '#cd7f32', icon: 'medal' as const };
      default:
        return { color: '#64748b', icon: null };
    }
  };

  const renderPodium = () => {
    if (leaderboard.length < 3) return null;

    const top3 = leaderboard.slice(0, 3);
    // Reorder for display: 2nd, 1st, 3rd
    const podiumOrder = [top3[1], top3[0], top3[2]];
    const heights = [100, 140, 80];

    return (
      <View style={styles.podiumContainer}>
        {podiumOrder.map((entry, index) => {
          const actualRank = index === 0 ? 2 : index === 1 ? 1 : 3;
          const rankStyle = getRankStyle(actualRank);

          return (
            <View key={entry.memberId} style={styles.podiumItem}>
              {entry.avatarUrl ? (
                <Image source={{ uri: entry.avatarUrl }} style={styles.podiumAvatar} />
              ) : (
                <View style={styles.podiumAvatarPlaceholder}>
                  <Text style={styles.podiumAvatarText}>
                    {entry.memberName.charAt(0)}
                  </Text>
                </View>
              )}
              <Text style={styles.podiumName} numberOfLines={1}>
                {entry.memberName}
              </Text>
              <Text style={[styles.podiumPoints, { color: rankStyle.color }]}>
                {entry.points.toLocaleString()}
              </Text>
              <View
                style={[
                  styles.podiumBar,
                  { height: heights[index], backgroundColor: rankStyle.color },
                ]}
              >
                <Text style={styles.podiumRank}>{actualRank}</Text>
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  const renderLeaderboardItem = ({ item }: { item: LeaderboardEntry }) => {
    const rankStyle = getRankStyle(item.rank);

    return (
      <Card
        style={[
          styles.leaderboardCard,
          item.isCurrentUser && styles.currentUserCard,
        ]}
      >
        <View style={styles.rankContainer}>
          {rankStyle.icon ? (
            <Ionicons name={rankStyle.icon} size={20} color={rankStyle.color} />
          ) : (
            <Text style={[styles.rankText, { color: rankStyle.color }]}>
              {item.rank}
            </Text>
          )}
        </View>

        {item.avatarUrl ? (
          <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>{item.memberName.charAt(0)}</Text>
          </View>
        )}

        <View style={styles.memberInfo}>
          <Text
            style={[
              styles.memberName,
              item.isCurrentUser && styles.currentUserName,
            ]}
          >
            {item.memberName}
            {item.isCurrentUser && ' (You)'}
          </Text>
        </View>

        <View style={styles.pointsContainer}>
          <Ionicons name="star" size={14} color="#f59e0b" />
          <Text style={styles.pointsText}>{item.points.toLocaleString()}</Text>
        </View>
      </Card>
    );
  };

  const renderHeader = () => (
    <View>
      {/* Period Tabs */}
      <View style={styles.periodTabs}>
        {(['weekly', 'monthly', 'allTime'] as Period[]).map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.periodTab, period === p && styles.periodTabActive]}
            onPress={() => setPeriod(p)}
          >
            <Text
              style={[
                styles.periodTabText,
                period === p && styles.periodTabTextActive,
              ]}
            >
              {p === 'weekly'
                ? 'This Week'
                : p === 'monthly'
                ? 'This Month'
                : 'All Time'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Podium */}
      {renderPodium()}

      {/* List Header */}
      <View style={styles.listHeader}>
        <Text style={styles.listHeaderText}>Full Rankings</Text>
      </View>
    </View>
  );

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
        <Text style={styles.title}>Leaderboard</Text>
        <View style={styles.placeholder} />
      </View>

      <FlatList
        data={leaderboard.slice(3)} // Skip top 3 since they're in podium
        renderItem={renderLeaderboardItem}
        keyExtractor={(item) => item.memberId}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="trophy-outline" size={64} color="#cbd5e1" />
              <Text style={styles.emptyText}>No rankings yet</Text>
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
  periodTabs: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
    backgroundColor: '#fff',
  },
  periodTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  periodTabActive: {
    backgroundColor: '#6366f1',
  },
  periodTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  periodTabTextActive: {
    color: '#fff',
  },
  podiumContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  podiumItem: {
    alignItems: 'center',
    marginHorizontal: 12,
    width: 80,
  },
  podiumAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginBottom: 8,
    borderWidth: 3,
    borderColor: '#fff',
  },
  podiumAvatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  podiumAvatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  podiumName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
    textAlign: 'center',
  },
  podiumPoints: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  podiumBar: {
    width: 60,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 8,
  },
  podiumRank: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  listHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8fafc',
  },
  listHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  listContent: {
    paddingBottom: 24,
  },
  leaderboardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
  },
  currentUserCard: {
    backgroundColor: '#ede9fe',
    borderWidth: 1,
    borderColor: '#6366f1',
  },
  rankContainer: {
    width: 32,
    alignItems: 'center',
  },
  rankText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginLeft: 8,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  memberInfo: {
    flex: 1,
    marginLeft: 12,
  },
  memberName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
  },
  currentUserName: {
    color: '#6366f1',
    fontWeight: '600',
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pointsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
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
});
