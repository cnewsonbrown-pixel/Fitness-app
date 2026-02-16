import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { Card, Button } from '../../components/common';
import { useAuthStore } from '../../store/auth.store';
import { useMemberStore } from '../../store/member.store';
import { RootStackParamList, Booking } from '../../types';

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { user, tenant } = useAuthStore();
  const {
    profile,
    upcomingBookings,
    fetchProfile,
    fetchUpcomingBookings,
    isLoading,
  } = useMemberStore();

  useEffect(() => {
    fetchProfile();
    fetchUpcomingBookings();
  }, []);

  const onRefresh = async () => {
    await Promise.all([fetchProfile(), fetchUpcomingBookings()]);
  };

  const renderUpcomingClass = (booking: Booking) => (
    <Card
      key={booking.id}
      variant="elevated"
      style={styles.classCard}
      onPress={() => navigation.navigate('ClassDetails', { classId: booking.classSession.id })}
    >
      <View style={styles.classHeader}>
        <View
          style={[
            styles.classColorBadge,
            { backgroundColor: booking.classSession.classType.color },
          ]}
        />
        <View style={styles.classInfo}>
          <Text style={styles.className}>{booking.classSession.classType.name}</Text>
          <Text style={styles.classInstructor}>
            with {booking.classSession.instructor.firstName}{' '}
            {booking.classSession.instructor.lastName}
          </Text>
        </View>
      </View>
      <View style={styles.classDetails}>
        <View style={styles.classDetail}>
          <Ionicons name="calendar-outline" size={16} color="#64748b" />
          <Text style={styles.classDetailText}>
            {format(new Date(booking.classSession.startTime), 'EEE, MMM d')}
          </Text>
        </View>
        <View style={styles.classDetail}>
          <Ionicons name="time-outline" size={16} color="#64748b" />
          <Text style={styles.classDetailText}>
            {format(new Date(booking.classSession.startTime), 'h:mm a')}
          </Text>
        </View>
        <View style={styles.classDetail}>
          <Ionicons name="location-outline" size={16} color="#64748b" />
          <Text style={styles.classDetailText}>
            {booking.classSession.location.name}
          </Text>
        </View>
      </View>
      {booking.status === 'CONFIRMED' && (
        <Button
          title="Check In"
          variant="outline"
          size="small"
          onPress={() => navigation.navigate('QRScanner')}
          style={styles.checkInButton}
        />
      )}
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              Hello, {user?.firstName || 'there'}!
            </Text>
            <Text style={styles.studioName}>{tenant?.name}</Text>
          </View>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <Ionicons name="person-circle-outline" size={40} color="#6366f1" />
          </TouchableOpacity>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <Card variant="elevated" style={styles.statCard}>
            <Ionicons name="flame" size={24} color="#f97316" />
            <Text style={styles.statValue}>{profile?.currentStreak || 0}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </Card>
          <Card variant="elevated" style={styles.statCard}>
            <Ionicons name="star" size={24} color="#eab308" />
            <Text style={styles.statValue}>{profile?.pointBalance || 0}</Text>
            <Text style={styles.statLabel}>Points</Text>
          </Card>
          <Card variant="elevated" style={styles.statCard}>
            <Ionicons name="calendar" size={24} color="#6366f1" />
            <Text style={styles.statValue}>{upcomingBookings.length}</Text>
            <Text style={styles.statLabel}>Upcoming</Text>
          </Card>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('QRScanner')}
            >
              <View style={styles.actionIcon}>
                <Ionicons name="qr-code" size={24} color="#6366f1" />
              </View>
              <Text style={styles.actionText}>Check In</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('Main', { screen: 'Schedule' } as any)}
            >
              <View style={styles.actionIcon}>
                <Ionicons name="add-circle" size={24} color="#6366f1" />
              </View>
              <Text style={styles.actionText}>Book Class</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('Main', { screen: 'Bookings' } as any)}
            >
              <View style={styles.actionIcon}>
                <Ionicons name="list" size={24} color="#6366f1" />
              </View>
              <Text style={styles.actionText}>My Bookings</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Upcoming Classes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Classes</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Main', { screen: 'Bookings' } as any)}
            >
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          {upcomingBookings.length === 0 ? (
            <Card variant="outlined" style={styles.emptyCard}>
              <Ionicons name="calendar-outline" size={48} color="#cbd5e1" />
              <Text style={styles.emptyText}>No upcoming classes</Text>
              <Button
                title="Browse Schedule"
                variant="outline"
                size="small"
                onPress={() => navigation.navigate('Main', { screen: 'Schedule' } as any)}
              />
            </Card>
          ) : (
            upcomingBookings.slice(0, 3).map(renderUpcomingClass)
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  studioName: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  profileButton: {
    padding: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  seeAll: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '500',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  classCard: {
    marginBottom: 12,
  },
  classHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  classColorBadge: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 12,
  },
  classInfo: {
    flex: 1,
  },
  className: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  classInstructor: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  classDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 12,
  },
  classDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  classDetailText: {
    fontSize: 14,
    color: '#64748b',
  },
  checkInButton: {
    alignSelf: 'flex-start',
  },
  emptyCard: {
    alignItems: 'center',
    padding: 32,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748b',
  },
});
