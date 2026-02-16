import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

import { useAuthStore } from '../store/auth.store';
import {
  RootStackParamList,
  AuthStackParamList,
  MemberTabParamList,
  InstructorTabParamList,
} from '../types';

// Auth Screens
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';

// Member Screens
import { HomeScreen } from '../screens/member/HomeScreen';
import { ScheduleScreen } from '../screens/member/ScheduleScreen';
import { ProfileScreen } from '../screens/member/ProfileScreen';
import { QRScannerScreen } from '../screens/member/QRScannerScreen';
import { ContentFeedScreen } from '../screens/member/ContentFeedScreen';
import { ArticleDetailsScreen } from '../screens/member/ArticleDetailsScreen';
import { GamificationScreen } from '../screens/member/GamificationScreen';
import { BadgesScreen } from '../screens/member/BadgesScreen';
import { ChallengeDetailsScreen } from '../screens/member/ChallengeDetailsScreen';
import { LeaderboardScreen } from '../screens/member/LeaderboardScreen';
import { PointsHistoryScreen } from '../screens/member/PointsHistoryScreen';
import { VideoLibraryScreen } from '../screens/member/VideoLibraryScreen';
import { VideoProgramScreen } from '../screens/member/VideoProgramScreen';
import { VideoPlayerScreen } from '../screens/member/VideoPlayerScreen';

// Instructor Screens
import { InstructorScheduleScreen } from '../screens/instructor/InstructorScheduleScreen';
import { ClassRosterScreen } from '../screens/instructor/ClassRosterScreen';
import { PaySummaryScreen } from '../screens/instructor/PaySummaryScreen';
import { SubstituteRequestsScreen } from '../screens/instructor/SubstituteRequestsScreen';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MemberTab = createBottomTabNavigator<MemberTabParamList>();
const InstructorTab = createBottomTabNavigator<InstructorTabParamList>();

// Auth Navigator
const AuthNavigator = () => (
  <AuthStack.Navigator screenOptions={{ headerShown: false }}>
    <AuthStack.Screen name="Login" component={LoginScreen} />
    <AuthStack.Screen name="Register" component={RegisterScreen} />
  </AuthStack.Navigator>
);

// Member Tab Navigator
const MemberTabNavigator = () => (
  <MemberTab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName: keyof typeof Ionicons.glyphMap;

        switch (route.name) {
          case 'Home':
            iconName = focused ? 'home' : 'home-outline';
            break;
          case 'Schedule':
            iconName = focused ? 'calendar' : 'calendar-outline';
            break;
          case 'Bookings':
            iconName = focused ? 'list' : 'list-outline';
            break;
          case 'Profile':
            iconName = focused ? 'person' : 'person-outline';
            break;
          default:
            iconName = 'help-outline';
        }

        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#6366f1',
      tabBarInactiveTintColor: '#94a3b8',
      headerShown: false,
      tabBarStyle: {
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
        paddingTop: 8,
        paddingBottom: 8,
        height: 60,
      },
      tabBarLabelStyle: {
        fontSize: 12,
        fontWeight: '500',
      },
    })}
  >
    <MemberTab.Screen name="Home" component={HomeScreen} />
    <MemberTab.Screen name="Schedule" component={ScheduleScreen} />
    <MemberTab.Screen
      name="Bookings"
      component={ScheduleScreen}
      options={{ title: 'My Bookings' }}
    />
    <MemberTab.Screen name="Profile" component={ProfileScreen} />
  </MemberTab.Navigator>
);

// Instructor Tab Navigator
const InstructorTabNavigator = () => (
  <InstructorTab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName: keyof typeof Ionicons.glyphMap;

        switch (route.name) {
          case 'Schedule':
            iconName = focused ? 'calendar' : 'calendar-outline';
            break;
          case 'Classes':
            iconName = focused ? 'fitness' : 'fitness-outline';
            break;
          case 'Roster':
            iconName = focused ? 'people' : 'people-outline';
            break;
          case 'Pay':
            iconName = focused ? 'wallet' : 'wallet-outline';
            break;
          default:
            iconName = 'help-outline';
        }

        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#6366f1',
      tabBarInactiveTintColor: '#94a3b8',
      headerShown: false,
      tabBarStyle: {
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
        paddingTop: 8,
        paddingBottom: 8,
        height: 60,
      },
      tabBarLabelStyle: {
        fontSize: 12,
        fontWeight: '500',
      },
    })}
  >
    <InstructorTab.Screen name="Schedule" component={InstructorScheduleScreen} />
    <InstructorTab.Screen name="Classes" component={InstructorScheduleScreen} />
    <InstructorTab.Screen name="Roster" component={ClassRosterScreen as any} />
    <InstructorTab.Screen name="Pay" component={PaySummaryScreen} />
  </InstructorTab.Navigator>
);

// Loading Screen
const LoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#6366f1" />
  </View>
);

// Main App Navigator
export const AppNavigator: React.FC = () => {
  const { isAuthenticated, isInitialized, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, []);

  if (!isInitialized) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        ) : (
          <>
            <RootStack.Screen name="Main" component={MemberTabNavigator} />
            <RootStack.Screen
              name="QRScanner"
              component={QRScannerScreen}
              options={{
                presentation: 'fullScreenModal',
                animation: 'slide_from_bottom',
              }}
            />
            <RootStack.Screen
              name="ClassDetails"
              component={ClassRosterScreen}
              options={{
                headerShown: true,
                title: 'Class Details',
              }}
            />
            {/* Content Screens */}
            <RootStack.Screen
              name="ContentFeed"
              component={ContentFeedScreen}
              options={{ headerShown: false }}
            />
            <RootStack.Screen
              name="ArticleDetails"
              component={ArticleDetailsScreen}
              options={{ headerShown: false }}
            />
            {/* Gamification Screens */}
            <RootStack.Screen
              name="Gamification"
              component={GamificationScreen}
              options={{ headerShown: false }}
            />
            <RootStack.Screen
              name="AllBadges"
              component={BadgesScreen}
              options={{ headerShown: false }}
            />
            <RootStack.Screen
              name="ChallengeDetails"
              component={ChallengeDetailsScreen}
              options={{ headerShown: false }}
            />
            <RootStack.Screen
              name="Leaderboard"
              component={LeaderboardScreen}
              options={{ headerShown: false }}
            />
            <RootStack.Screen
              name="PointsHistory"
              component={PointsHistoryScreen}
              options={{ headerShown: false }}
            />
            {/* Video Screens */}
            <RootStack.Screen
              name="VideoLibrary"
              component={VideoLibraryScreen}
              options={{ headerShown: false }}
            />
            <RootStack.Screen
              name="VideoProgram"
              component={VideoProgramScreen}
              options={{ headerShown: false }}
            />
            <RootStack.Screen
              name="VideoPlayer"
              component={VideoPlayerScreen}
              options={{ headerShown: false }}
            />
            {/* Instructor Screens */}
            <RootStack.Screen
              name="SubstituteRequests"
              component={SubstituteRequestsScreen}
              options={{ headerShown: false }}
            />
          </>
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
});
