import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card } from '../../components/common';
import {
  gamificationService,
  PointTransaction,
} from '../../services/gamification.service';
import { RootStackParamList } from '../../types';

type PointsHistoryScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

export const PointsHistoryScreen: React.FC<PointsHistoryScreenProps> = ({
  navigation,
}) => {
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [balance, setBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async (refresh = false) => {
    try {
      const currentPage = refresh ? 1 : page;

      const [balanceData, historyData] = await Promise.all([
        gamificationService.getPointsBalance(),
        gamificationService.getPointsHistory({ page: currentPage, limit: 20 }),
      ]);

      setBalance(balanceData);

      if (refresh) {
        setTransactions(historyData.data);
        setPage(2);
      } else {
        setTransactions((prev) => [...prev, ...historyData.data]);
        setPage((prev) => prev + 1);
      }

      setHasMore(historyData.data.length === 20);
    } catch (error) {
      console.error('Failed to fetch points history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = useCallback(() => {
    setIsLoading(true);
    fetchData(true);
  }, []);

  const loadMore = () => {
    if (hasMore && !isLoading) {
      fetchData();
    }
  };

  const getTransactionIcon = (type: string): keyof typeof Ionicons.glyphMap => {
    switch (type.toLowerCase()) {
      case 'attendance':
      case 'class_attended':
        return 'fitness';
      case 'check_in':
      case 'streak':
        return 'flame';
      case 'challenge':
      case 'challenge_completed':
        return 'trophy';
      case 'badge':
      case 'badge_earned':
        return 'ribbon';
      case 'referral':
        return 'people';
      case 'purchase':
      case 'spent':
        return 'cart';
      case 'bonus':
        return 'gift';
      default:
        return 'star';
    }
  };

  const getTransactionColor = (points: number) => {
    return points >= 0 ? '#10b981' : '#ef4444';
  };

  const renderTransaction = ({ item }: { item: PointTransaction }) => {
    const isPositive = item.points >= 0;
    const color = getTransactionColor(item.points);

    return (
      <Card style={styles.transactionCard}>
        <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
          <Ionicons
            name={getTransactionIcon(item.type)}
            size={20}
            color={color}
          />
        </View>

        <View style={styles.transactionInfo}>
          <Text style={styles.transactionDescription}>{item.description}</Text>
          <Text style={styles.transactionDate}>
            {format(new Date(item.createdAt), 'MMM d, yyyy · h:mm a')}
          </Text>
        </View>

        <Text style={[styles.transactionPoints, { color }]}>
          {isPositive ? '+' : ''}
          {item.points}
        </Text>
      </Card>
    );
  };

  const renderHeader = () => (
    <Card style={styles.balanceCard}>
      <View style={styles.balanceContent}>
        <View style={styles.balanceIcon}>
          <Ionicons name="star" size={32} color="#f59e0b" />
        </View>
        <View style={styles.balanceInfo}>
          <Text style={styles.balanceLabel}>Current Balance</Text>
          <Text style={styles.balanceValue}>{balance.toLocaleString()}</Text>
          <Text style={styles.balanceUnit}>points</Text>
        </View>
      </View>

      {/* Quick Stats */}
      <View style={styles.quickStats}>
        <View style={styles.quickStatItem}>
          <Ionicons name="trending-up" size={16} color="#10b981" />
          <Text style={styles.quickStatLabel}>This Month</Text>
          <Text style={styles.quickStatValue}>
            +{transactions
              .filter((t) => {
                const transDate = new Date(t.createdAt);
                const now = new Date();
                return (
                  transDate.getMonth() === now.getMonth() &&
                  transDate.getFullYear() === now.getFullYear() &&
                  t.points > 0
                );
              })
              .reduce((sum, t) => sum + t.points, 0)
              .toLocaleString()}
          </Text>
        </View>
      </View>
    </Card>
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
        <Text style={styles.title}>Points History</Text>
        <View style={styles.placeholder} />
      </View>

      <FlatList
        data={transactions}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isLoading && page === 1} onRefresh={onRefresh} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="time-outline" size={64} color="#cbd5e1" />
              <Text style={styles.emptyText}>No transactions yet</Text>
              <Text style={styles.emptySubtext}>
                Earn points by attending classes and completing challenges
              </Text>
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
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
  balanceCard: {
    marginBottom: 24,
    padding: 20,
  },
  balanceContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  balanceIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  balanceInfo: {
    flex: 1,
  },
  balanceLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  balanceUnit: {
    fontSize: 14,
    color: '#64748b',
  },
  quickStats: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  quickStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quickStatLabel: {
    fontSize: 14,
    color: '#64748b',
    flex: 1,
  },
  quickStatValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10b981',
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    padding: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: '#94a3b8',
  },
  transactionPoints: {
    fontSize: 16,
    fontWeight: 'bold',
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
    textAlign: 'center',
  },
});
