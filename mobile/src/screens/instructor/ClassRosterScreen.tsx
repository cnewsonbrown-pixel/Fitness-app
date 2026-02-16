import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { format } from 'date-fns';
import { Card, Button } from '../../components/common';
import { instructorService } from '../../services/instructor.service';
import { Booking, ClassSession, RootStackParamList } from '../../types';

type ClassRosterScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
  route: RouteProp<RootStackParamList, 'ClassDetails'>;
};

export const ClassRosterScreen: React.FC<ClassRosterScreenProps> = ({
  navigation,
  route,
}) => {
  const { classId } = route.params;
  const [roster, setRoster] = useState<Booking[]>([]);
  const [waitlist, setWaitlist] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'roster' | 'waitlist'>('roster');

  useEffect(() => {
    fetchData();
  }, [classId]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [rosterData, waitlistData] = await Promise.all([
        instructorService.getClassRoster(classId),
        instructorService.getClassWaitlist(classId),
      ]);
      setRoster(rosterData);
      setWaitlist(waitlistData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckIn = async (bookingId: string, memberName: string) => {
    try {
      await instructorService.checkInMember(bookingId);
      Alert.alert('Success', `${memberName} has been checked in`);
      fetchData();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error?.message || 'Failed to check in');
    }
  };

  const handleNoShow = async (bookingId: string, memberName: string) => {
    Alert.alert(
      'Mark as No Show',
      `Are you sure you want to mark ${memberName} as a no-show?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: 'destructive',
          onPress: async () => {
            try {
              await instructorService.markNoShow(bookingId);
              Alert.alert('Success', `${memberName} marked as no-show`);
              fetchData();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.error?.message || 'Failed to update');
            }
          },
        },
      ]
    );
  };

  const renderBookingItem = ({ item }: { item: Booking }) => {
    const isCheckedIn = item.status === 'CHECKED_IN';
    const isNoShow = item.status === 'NO_SHOW';

    return (
      <Card variant="default" style={styles.memberCard}>
        <View style={styles.memberInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {item.classSession?.instructor?.firstName?.[0] || 'M'}
            </Text>
          </View>
          <View style={styles.memberDetails}>
            <Text style={styles.memberName}>Member Name</Text>
            <Text style={styles.memberEmail}>member@email.com</Text>
          </View>
        </View>

        <View style={styles.statusContainer}>
          {isCheckedIn ? (
            <View style={styles.checkedInBadge}>
              <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
              <Text style={styles.checkedInText}>Checked In</Text>
            </View>
          ) : isNoShow ? (
            <View style={styles.noShowBadge}>
              <Ionicons name="close-circle" size={20} color="#ef4444" />
              <Text style={styles.noShowText}>No Show</Text>
            </View>
          ) : (
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.checkInButton}
                onPress={() => handleCheckIn(item.id, 'Member')}
              >
                <Ionicons name="checkmark" size={20} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.noShowButton}
                onPress={() => handleNoShow(item.id, 'Member')}
              >
                <Ionicons name="close" size={20} color="#ef4444" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Card>
    );
  };

  const renderWaitlistItem = ({ item, index }: { item: Booking; index: number }) => (
    <Card variant="default" style={styles.memberCard}>
      <View style={styles.waitlistPosition}>
        <Text style={styles.positionNumber}>#{index + 1}</Text>
      </View>
      <View style={styles.memberInfo}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>M</Text>
        </View>
        <View style={styles.memberDetails}>
          <Text style={styles.memberName}>Member Name</Text>
          <Text style={styles.memberEmail}>member@email.com</Text>
        </View>
      </View>
    </Card>
  );

  const checkedInCount = roster.filter((b) => b.status === 'CHECKED_IN').length;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Stats */}
      <View style={styles.statsHeader}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{roster.length}</Text>
          <Text style={styles.statLabel}>Booked</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{checkedInCount}</Text>
          <Text style={styles.statLabel}>Checked In</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{waitlist.length}</Text>
          <Text style={styles.statLabel}>Waitlist</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'roster' && styles.activeTab]}
          onPress={() => setActiveTab('roster')}
        >
          <Text style={[styles.tabText, activeTab === 'roster' && styles.activeTabText]}>
            Class Roster ({roster.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'waitlist' && styles.activeTab]}
          onPress={() => setActiveTab('waitlist')}
        >
          <Text style={[styles.tabText, activeTab === 'waitlist' && styles.activeTabText]}>
            Waitlist ({waitlist.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      <FlatList
        data={activeTab === 'roster' ? roster : waitlist}
        renderItem={activeTab === 'roster' ? renderBookingItem : renderWaitlistItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={fetchData} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={48} color="#cbd5e1" />
            <Text style={styles.emptyText}>
              {activeTab === 'roster' ? 'No bookings yet' : 'No one on waitlist'}
            </Text>
          </View>
        }
      />

      {/* Quick Check-in All Button */}
      {activeTab === 'roster' && roster.some((b) => b.status === 'CONFIRMED') && (
        <View style={styles.footer}>
          <Button
            title="Check In All Present"
            onPress={() => {
              Alert.alert('Check In All', 'Check in all members present?', [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Confirm',
                  onPress: async () => {
                    // In production, this would be a batch operation
                    for (const booking of roster.filter((b) => b.status === 'CONFIRMED')) {
                      await handleCheckIn(booking.id, 'Member');
                    }
                  },
                },
              ]);
            }}
          />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  statsHeader: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e2e8f0',
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
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tab: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#6366f1',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  activeTabText: {
    color: '#6366f1',
  },
  listContent: {
    padding: 16,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  waitlistPosition: {
    width: 40,
    alignItems: 'center',
  },
  positionNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  memberInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1e293b',
  },
  memberEmail: {
    fontSize: 14,
    color: '#64748b',
  },
  statusContainer: {
    marginLeft: 12,
  },
  checkedInBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f0fdf4',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  checkedInText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#22c55e',
  },
  noShowBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fef2f2',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  noShowText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ef4444',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  checkInButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noShowButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fef2f2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 12,
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
});
