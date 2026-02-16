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
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, differenceInDays } from 'date-fns';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Card } from '../../components/common';
import {
  gamificationService,
  Challenge,
  LeaderboardEntry,
} from '../../services/gamification.service';
import { RootStackParamList } from '../../types';

type ChallengeDetailsScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'ChallengeDetails'
>;

export const ChallengeDetailsScreen: React.FC<ChallengeDetailsScreenProps> = ({
  navigation,
  route,
}) => {
  const { challengeId } = route.params;
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    fetchChallenge();
  }, [challengeId]);

  const fetchChallenge = async () => {
    try {
      const [challengeData, leaderboardData] = await Promise.all([
        gamificationService.getChallenge(challengeId),
        gamificationService.getChallengeLeaderboard(challengeId),
      ]);
      setChallenge(challengeData);
      setLeaderboard(leaderboardData);
    } catch (error) {
      console.error('Failed to fetch challenge:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = useCallback(() => {
    setIsLoading(true);
    fetchChallenge();
  }, [challengeId]);

  const handleJoinLeave = async () => {
    if (!challenge || isJoining) return;

    setIsJoining(true);
    try {
      if (challenge.isJoined) {
        Alert.alert(
          'Leave Challenge',
          'Are you sure you want to leave this challenge? Your progress will be lost.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Leave',
              style: 'destructive',
              onPress: async () => {
                await gamificationService.leaveChallenge(challenge.id);
                setChallenge({ ...challenge, isJoined: false });
              },
            },
          ]
        );
      } else {
        await gamificationService.joinChallenge(challenge.id);
        setChallenge({ ...challenge, isJoined: true });
      }
    } catch (error) {
      console.error('Failed to join/leave challenge:', error);
      Alert.alert('Error', 'Failed to update challenge participation');
    } finally {
      setIsJoining(false);
    }
  };

  const getDaysRemaining = () => {
    if (!challenge) return 0;
    const endDate = new Date(challenge.endDate);
    const today = new Date();
    return Math.max(0, differenceInDays(endDate, today));
  };

  const getProgressPercentage = () => {
    if (!challenge) return 0;
    return Math.min((challenge.currentProgress / challenge.goal) * 100, 100);
  };

  const renderLeaderboardItem = (entry: LeaderboardEntry, index: number) => {
    const getRankIcon = (rank: number) => {
      switch (rank) {
        case 1:
          return { icon: 'trophy', color: '#f59e0b' };
        case 2:
          return { icon: 'medal', color: '#94a3b8' };
        case 3:
          return { icon: 'medal', color: '#cd7f32' };
        default:
          return null;
      }
    };

    const rankIcon = getRankIcon(entry.rank);

    return (
      <View
        key={entry.memberId}
        style={[
          styles.leaderboardItem,
          entry.isCurrentUser && styles.currentUserItem,
        ]}
      >
        <View style={styles.rankContainer}>
          {rankIcon ? (
            <Ionicons
              name={rankIcon.icon as any}
              size={18}
              color={rankIcon.color}
            />
          ) : (
            <Text style={styles.rankText}>{entry.rank}</Text>
          )}
        </View>

        {entry.avatarUrl ? (
          <Image source={{ uri: entry.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>{entry.memberName.charAt(0)}</Text>
          </View>
        )}

        <Text
          style={[
            styles.memberName,
            entry.isCurrentUser && styles.currentUserName,
          ]}
          numberOfLines={1}
        >
          {entry.memberName}
          {entry.isCurrentUser && ' (You)'}
        </Text>

        <Text style={styles.entryPoints}>{entry.points}</Text>
      </View>
    );
  };

  if (isLoading && !challenge) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!challenge) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#cbd5e1" />
          <Text style={styles.errorText}>Challenge not found</Text>
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
        <Text style={styles.headerTitle}>Challenge</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Challenge Info */}
        <Card style={styles.infoCard}>
          <View style={styles.challengeType}>
            <Ionicons
              name={challenge.type === 'TEAM' ? 'people' : 'person'}
              size={16}
              color="#6366f1"
            />
            <Text style={styles.challengeTypeText}>
              {challenge.type === 'TEAM' ? 'Team Challenge' : 'Individual Challenge'}
            </Text>
          </View>

          <Text style={styles.challengeName}>{challenge.name}</Text>
          <Text style={styles.challengeDescription}>{challenge.description}</Text>

          {/* Dates */}
          <View style={styles.datesRow}>
            <View style={styles.dateItem}>
              <Ionicons name="calendar-outline" size={16} color="#64748b" />
              <Text style={styles.dateText}>
                {format(new Date(challenge.startDate), 'MMM d')} -{' '}
                {format(new Date(challenge.endDate), 'MMM d, yyyy')}
              </Text>
            </View>
            <View style={styles.daysRemaining}>
              <Text style={styles.daysRemainingValue}>{getDaysRemaining()}</Text>
              <Text style={styles.daysRemainingLabel}>days left</Text>
            </View>
          </View>
        </Card>

        {/* Progress */}
        {challenge.isJoined && (
          <Card style={styles.progressCard}>
            <Text style={styles.progressTitle}>Your Progress</Text>

            <View style={styles.progressStats}>
              <View style={styles.progressStatItem}>
                <Text style={styles.progressStatValue}>
                  {challenge.currentProgress}
                </Text>
                <Text style={styles.progressStatLabel}>
                  {challenge.unit} completed
                </Text>
              </View>
              <View style={styles.progressStatDivider} />
              <View style={styles.progressStatItem}>
                <Text style={styles.progressStatValue}>{challenge.goal}</Text>
                <Text style={styles.progressStatLabel}>Goal</Text>
              </View>
              {challenge.rank && (
                <>
                  <View style={styles.progressStatDivider} />
                  <View style={styles.progressStatItem}>
                    <Text style={styles.progressStatValue}>#{challenge.rank}</Text>
                    <Text style={styles.progressStatLabel}>Rank</Text>
                  </View>
                </>
              )}
            </View>

            <View style={styles.progressBarContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${getProgressPercentage()}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressPercent}>
                {Math.round(getProgressPercentage())}%
              </Text>
            </View>
          </Card>
        )}

        {/* Reward */}
        <Card style={styles.rewardCard}>
          <View style={styles.rewardHeader}>
            <Ionicons name="gift" size={24} color="#f59e0b" />
            <Text style={styles.rewardTitle}>Reward</Text>
          </View>

          <View style={styles.rewardContent}>
            <View style={styles.rewardItem}>
              <Ionicons name="star" size={20} color="#f59e0b" />
              <Text style={styles.rewardText}>
                {challenge.reward.points} Points
              </Text>
            </View>

            {challenge.reward.badge && (
              <View style={styles.rewardItem}>
                <Ionicons name="ribbon" size={20} color="#6366f1" />
                <Text style={styles.rewardText}>
                  {challenge.reward.badge.name} Badge
                </Text>
              </View>
            )}
          </View>
        </Card>

        {/* Leaderboard */}
        <View style={styles.leaderboardSection}>
          <Text style={styles.sectionTitle}>Leaderboard</Text>
          <Text style={styles.participantsCount}>
            {challenge.participants} participants
          </Text>

          <Card style={styles.leaderboardCard}>
            {leaderboard.length > 0 ? (
              leaderboard.slice(0, 10).map(renderLeaderboardItem)
            ) : (
              <View style={styles.emptyLeaderboard}>
                <Ionicons name="trophy-outline" size={48} color="#cbd5e1" />
                <Text style={styles.emptyText}>No participants yet</Text>
                <Text style={styles.emptySubtext}>
                  Be the first to join this challenge!
                </Text>
              </View>
            )}
          </Card>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Join/Leave Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            challenge.isJoined && styles.leaveButton,
            isJoining && styles.buttonDisabled,
          ]}
          onPress={handleJoinLeave}
          disabled={isJoining}
        >
          <Ionicons
            name={challenge.isJoined ? 'exit-outline' : 'add-circle-outline'}
            size={20}
            color="#fff"
          />
          <Text style={styles.actionButtonText}>
            {isJoining
              ? 'Processing...'
              : challenge.isJoined
              ? 'Leave Challenge'
              : 'Join Challenge'}
          </Text>
        </TouchableOpacity>
      </View>
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
  infoCard: {
    margin: 16,
    marginBottom: 12,
  },
  challengeType: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  challengeTypeText: {
    fontSize: 12,
    color: '#6366f1',
    fontWeight: '600',
  },
  challengeName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  challengeDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 22,
    marginBottom: 16,
  },
  datesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  dateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 13,
    color: '#64748b',
  },
  daysRemaining: {
    alignItems: 'center',
  },
  daysRemainingValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6366f1',
  },
  daysRemainingLabel: {
    fontSize: 11,
    color: '#94a3b8',
  },
  progressCard: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  progressStatItem: {
    alignItems: 'center',
  },
  progressStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  progressStatLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  progressStatDivider: {
    width: 1,
    backgroundColor: '#e2e8f0',
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 12,
    backgroundColor: '#e2e8f0',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 6,
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
    width: 40,
    textAlign: 'right',
  },
  rewardCard: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  rewardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  rewardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  rewardContent: {
    flexDirection: 'row',
    gap: 24,
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rewardText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  leaderboardSection: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  participantsCount: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 12,
  },
  leaderboardCard: {
    padding: 0,
    overflow: 'hidden',
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  currentUserItem: {
    backgroundColor: '#ede9fe',
  },
  rankContainer: {
    width: 28,
    alignItems: 'center',
  },
  rankText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginLeft: 8,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  avatarText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  memberName: {
    flex: 1,
    fontSize: 14,
    color: '#1e293b',
    marginLeft: 12,
  },
  currentUserName: {
    fontWeight: '600',
    color: '#6366f1',
  },
  entryPoints: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  emptyLeaderboard: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
  },
  bottomPadding: {
    height: 100,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#6366f1',
    paddingVertical: 14,
    borderRadius: 12,
  },
  leaveButton: {
    backgroundColor: '#ef4444',
  },
  buttonDisabled: {
    backgroundColor: '#94a3b8',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
