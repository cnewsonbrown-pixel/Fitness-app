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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card } from '../../components/common';
import {
  gamificationService,
  GamificationSummary,
  Badge,
  Challenge,
} from '../../services/gamification.service';
import { RootStackParamList } from '../../types';

type GamificationScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

export const GamificationScreen: React.FC<GamificationScreenProps> = ({
  navigation,
}) => {
  const [summary, setSummary] = useState<GamificationSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingIn, setIsCheckingIn] = useState(false);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      const data = await gamificationService.getSummary();
      setSummary(data);
    } catch (error) {
      console.error('Failed to fetch gamification summary:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = useCallback(() => {
    setIsLoading(true);
    fetchSummary();
  }, []);

  const handleCheckIn = async () => {
    if (isCheckingIn) return;

    setIsCheckingIn(true);
    try {
      const result = await gamificationService.checkIn();
      // Refresh summary to show updated streak
      await fetchSummary();
      // Could show a toast or animation here
    } catch (error) {
      console.error('Failed to check in:', error);
    } finally {
      setIsCheckingIn(false);
    }
  };

  const renderStatCard = (
    icon: keyof typeof Ionicons.glyphMap,
    label: string,
    value: string | number,
    color: string
  ) => (
    <Card style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Card>
  );

  const renderBadge = (badge: Badge) => (
    <TouchableOpacity
      key={badge.id}
      style={styles.badgeItem}
      onPress={() => navigation.navigate('BadgeDetails', { badgeId: badge.id })}
    >
      {badge.iconUrl ? (
        <Image source={{ uri: badge.iconUrl }} style={styles.badgeIcon} />
      ) : (
        <View style={styles.badgeIconPlaceholder}>
          <Ionicons name="ribbon" size={24} color="#6366f1" />
        </View>
      )}
      <Text style={styles.badgeName} numberOfLines={1}>
        {badge.name}
      </Text>
    </TouchableOpacity>
  );

  const renderChallenge = (challenge: Challenge) => (
    <Card
      key={challenge.id}
      variant="elevated"
      style={styles.challengeCard}
      onPress={() =>
        navigation.navigate('ChallengeDetails', { challengeId: challenge.id })
      }
    >
      <View style={styles.challengeHeader}>
        <View style={styles.challengeType}>
          <Ionicons
            name={challenge.type === 'TEAM' ? 'people' : 'person'}
            size={14}
            color="#6366f1"
          />
          <Text style={styles.challengeTypeText}>
            {challenge.type === 'TEAM' ? 'Team' : 'Individual'}
          </Text>
        </View>
        {challenge.isJoined && (
          <View style={styles.joinedBadge}>
            <Text style={styles.joinedText}>Joined</Text>
          </View>
        )}
      </View>

      <Text style={styles.challengeName}>{challenge.name}</Text>
      <Text style={styles.challengeDescription} numberOfLines={2}>
        {challenge.description}
      </Text>

      {/* Progress Bar */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressText}>
            {challenge.currentProgress} / {challenge.goal} {challenge.unit}
          </Text>
          <Text style={styles.progressPercent}>
            {Math.round((challenge.currentProgress / challenge.goal) * 100)}%
          </Text>
        </View>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.min(
                  (challenge.currentProgress / challenge.goal) * 100,
                  100
                )}%`,
              },
            ]}
          />
        </View>
      </View>

      <View style={styles.challengeFooter}>
        <View style={styles.rewardSection}>
          <Ionicons name="gift" size={16} color="#f59e0b" />
          <Text style={styles.rewardText}>
            {challenge.reward.points} points
          </Text>
        </View>
        <Text style={styles.participantsText}>
          {challenge.participants} participants
        </Text>
      </View>
    </Card>
  );

  if (isLoading && !summary) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Rewards</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('PointsHistory')}
        >
          <Ionicons name="time-outline" size={24} color="#1e293b" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {renderStatCard('star', 'Points', summary?.totalPoints || 0, '#f59e0b')}
          {renderStatCard(
            'flame',
            'Streak',
            `${summary?.currentStreak || 0} days`,
            '#ef4444'
          )}
          {renderStatCard(
            'ribbon',
            'Badges',
            summary?.badgeCount || 0,
            '#6366f1'
          )}
          {renderStatCard(
            'trophy',
            'Rank',
            `#${summary?.rank || '-'}`,
            '#10b981'
          )}
        </View>

        {/* Check-in Button */}
        <Card style={styles.checkInCard}>
          <View style={styles.checkInContent}>
            <View>
              <Text style={styles.checkInTitle}>Daily Check-in</Text>
              <Text style={styles.checkInSubtitle}>
                Earn points and keep your streak alive!
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.checkInButton,
                isCheckingIn && styles.checkInButtonDisabled,
              ]}
              onPress={handleCheckIn}
              disabled={isCheckingIn}
            >
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.checkInButtonText}>
                {isCheckingIn ? 'Checking...' : 'Check In'}
              </Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Recent Badges */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Badges</Text>
            <TouchableOpacity onPress={() => navigation.navigate('AllBadges')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.badgesContainer}
          >
            {summary?.recentAchievements?.length ? (
              summary.recentAchievements.map(renderBadge)
            ) : (
              <View style={styles.emptyBadges}>
                <Ionicons name="ribbon-outline" size={32} color="#cbd5e1" />
                <Text style={styles.emptyText}>No badges yet</Text>
              </View>
            )}
          </ScrollView>
        </View>

        {/* Active Challenges */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Active Challenges</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('AllChallenges')}
            >
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          {summary?.activeChallenges?.length ? (
            summary.activeChallenges.map(renderChallenge)
          ) : (
            <Card style={styles.emptyCard}>
              <Ionicons name="flag-outline" size={48} color="#cbd5e1" />
              <Text style={styles.emptyCardTitle}>No active challenges</Text>
              <Text style={styles.emptyCardText}>
                Check back soon for new challenges
              </Text>
            </Card>
          )}
        </View>

        {/* Leaderboard Preview */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Leaderboard</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Leaderboard')}>
              <Text style={styles.seeAllText}>View Full</Text>
            </TouchableOpacity>
          </View>
          <Card
            variant="elevated"
            style={styles.leaderboardCard}
            onPress={() => navigation.navigate('Leaderboard')}
          >
            <View style={styles.leaderboardPreview}>
              <View style={styles.rankBadge}>
                <Ionicons name="trophy" size={24} color="#f59e0b" />
              </View>
              <View style={styles.leaderboardInfo}>
                <Text style={styles.leaderboardRank}>
                  Your Rank: #{summary?.rank || '-'}
                </Text>
                <Text style={styles.leaderboardTotal}>
                  out of {summary?.totalMembers || 0} members
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#94a3b8" />
            </View>
          </Card>
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 16,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  checkInCard: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  checkInContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  checkInTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  checkInSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  checkInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#6366f1',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  checkInButtonDisabled: {
    backgroundColor: '#94a3b8',
  },
  checkInButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  seeAllText: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '500',
  },
  badgesContainer: {
    paddingHorizontal: 16,
    gap: 16,
  },
  badgeItem: {
    alignItems: 'center',
    width: 72,
  },
  badgeIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginBottom: 8,
  },
  badgeIconPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ede9fe',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  badgeName: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  emptyBadges: {
    alignItems: 'center',
    padding: 24,
    width: '100%',
  },
  emptyText: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 8,
  },
  challengeCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  challengeType: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  challengeTypeText: {
    fontSize: 12,
    color: '#6366f1',
    fontWeight: '500',
  },
  joinedBadge: {
    backgroundColor: '#dcfce7',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  joinedText: {
    fontSize: 10,
    color: '#16a34a',
    fontWeight: '600',
  },
  challengeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  challengeDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 12,
  },
  progressSection: {
    marginBottom: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressText: {
    fontSize: 12,
    color: '#64748b',
  },
  progressPercent: {
    fontSize: 12,
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
  challengeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rewardSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rewardText: {
    fontSize: 12,
    color: '#f59e0b',
    fontWeight: '600',
  },
  participantsText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  emptyCard: {
    marginHorizontal: 16,
    alignItems: 'center',
    padding: 32,
  },
  emptyCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 12,
  },
  emptyCardText: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
  },
  leaderboardCard: {
    marginHorizontal: 16,
    padding: 16,
  },
  leaderboardPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rankBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leaderboardInfo: {
    flex: 1,
  },
  leaderboardRank: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  leaderboardTotal: {
    fontSize: 12,
    color: '#64748b',
  },
  bottomPadding: {
    height: 24,
  },
});
