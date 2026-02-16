import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card, Button } from '../../components/common';
import { useAuthStore } from '../../store/auth.store';
import { useMemberStore } from '../../store/member.store';
import { RootStackParamList } from '../../types';

type ProfileScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { user, logout } = useAuthStore();
  const { profile, memberships, badges, fetchProfile, fetchMemberships, fetchBadges } = useMemberStore();

  useEffect(() => {
    fetchProfile();
    fetchMemberships();
    fetchBadges();
  }, []);

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => logout(),
        },
      ]
    );
  };

  const activeMembership = memberships.find((m) => m.status === 'ACTIVE');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </Text>
            </View>
            <TouchableOpacity style={styles.editAvatarButton}>
              <Ionicons name="camera" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.name}>
            {user?.firstName} {user?.lastName}
          </Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile?.currentStreak || 0}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile?.pointBalance || 0}</Text>
            <Text style={styles.statLabel}>Points</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{badges.length}</Text>
            <Text style={styles.statLabel}>Badges</Text>
          </View>
        </View>

        {/* Active Membership */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Membership</Text>
          {activeMembership ? (
            <Card
              variant="elevated"
              onPress={() => navigation.navigate('MembershipDetails', { membershipId: activeMembership.id })}
            >
              <View style={styles.membershipCard}>
                <View style={styles.membershipBadge}>
                  <Ionicons name="card" size={24} color="#6366f1" />
                </View>
                <View style={styles.membershipInfo}>
                  <Text style={styles.membershipName}>
                    {activeMembership.membershipType.name}
                  </Text>
                  <Text style={styles.membershipStatus}>Active</Text>
                  {activeMembership.creditsRemaining !== undefined && (
                    <Text style={styles.membershipCredits}>
                      {activeMembership.creditsRemaining} credits remaining
                    </Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
              </View>
            </Card>
          ) : (
            <Card variant="outlined" style={styles.noMembershipCard}>
              <Ionicons name="card-outline" size={40} color="#cbd5e1" />
              <Text style={styles.noMembershipText}>No active membership</Text>
              <Button title="View Plans" variant="outline" size="small" />
            </Card>
          )}
        </View>

        {/* Menu Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <Card variant="default">
            <MenuItem
              icon="person-outline"
              label="Edit Profile"
              onPress={() => {}}
            />
            <MenuItem
              icon="notifications-outline"
              label="Notifications"
              onPress={() => {}}
            />
            <MenuItem
              icon="card-outline"
              label="Payment Methods"
              onPress={() => {}}
            />
            <MenuItem
              icon="receipt-outline"
              label="Billing History"
              onPress={() => {}}
              isLast
            />
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <Card variant="default">
            <MenuItem
              icon="help-circle-outline"
              label="Help & FAQ"
              onPress={() => {}}
            />
            <MenuItem
              icon="chatbubble-outline"
              label="Contact Us"
              onPress={() => {}}
            />
            <MenuItem
              icon="document-text-outline"
              label="Terms of Service"
              onPress={() => {}}
            />
            <MenuItem
              icon="shield-outline"
              label="Privacy Policy"
              onPress={() => {}}
              isLast
            />
          </Card>
        </View>

        {/* Logout Button */}
        <Button
          title="Sign Out"
          variant="outline"
          onPress={handleLogout}
          style={styles.logoutButton}
        />

        <Text style={styles.version}>Version 1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const MenuItem: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  isLast?: boolean;
}> = ({ icon, label, onPress, isLast }) => (
  <TouchableOpacity
    style={[styles.menuItem, !isLast && styles.menuItemBorder]}
    onPress={onPress}
  >
    <Ionicons name={icon} size={22} color="#64748b" />
    <Text style={styles.menuLabel}>{label}</Text>
    <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#f8fafc',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  email: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statItem: {
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 12,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  membershipCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  membershipBadge: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  membershipInfo: {
    flex: 1,
  },
  membershipName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  membershipStatus: {
    fontSize: 14,
    color: '#22c55e',
    marginTop: 2,
  },
  membershipCredits: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  noMembershipCard: {
    alignItems: 'center',
    padding: 32,
    gap: 12,
  },
  noMembershipText: {
    fontSize: 14,
    color: '#64748b',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 16,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
  },
  logoutButton: {
    marginVertical: 16,
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 32,
  },
});
