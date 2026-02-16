// User & Authentication Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Tenant Types
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  timezone: string;
  settings: TenantSettings;
}

export interface TenantSettings {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
}

// Member Types
export interface Member {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatarUrl?: string;
  lifecycleStage: LifecycleStage;
  tags: string[];
  pointBalance: number;
  currentStreak: number;
  longestStreak: number;
}

export type LifecycleStage = 'LEAD' | 'TRIAL' | 'ACTIVE' | 'AT_RISK' | 'CHURNED' | 'PAUSED';

// Membership Types
export interface Membership {
  id: string;
  membershipType: MembershipType;
  status: MembershipStatus;
  startDate: string;
  endDate?: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  creditsRemaining?: number;
  pausedAt?: string;
  pauseEndDate?: string;
}

export interface MembershipType {
  id: string;
  name: string;
  type: 'RECURRING' | 'CLASS_PACK' | 'DROP_IN';
  price: number;
  billingPeriod?: 'MONTHLY' | 'YEARLY' | 'WEEKLY';
  classCredits?: number;
  description?: string;
}

export type MembershipStatus = 'ACTIVE' | 'PAUSED' | 'CANCELLED' | 'EXPIRED' | 'PAST_DUE' | 'PENDING';

// Location Types
export interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  timezone: string;
  isActive: boolean;
}

// Class Types
export interface ClassType {
  id: string;
  name: string;
  description?: string;
  duration: number;
  color: string;
}

export interface ClassSession {
  id: string;
  classType: ClassType;
  location: Location;
  instructor: Instructor;
  startTime: string;
  endTime: string;
  capacity: number;
  bookedCount: number;
  waitlistCount: number;
  status: ClassStatus;
  isCancelled: boolean;
}

export type ClassStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

// Booking Types
export interface Booking {
  id: string;
  classSession: ClassSession;
  status: BookingStatus;
  checkedInAt?: string;
  isWaitlisted: boolean;
  waitlistPosition?: number;
  createdAt: string;
}

export type BookingStatus = 'CONFIRMED' | 'WAITLISTED' | 'CHECKED_IN' | 'NO_SHOW' | 'CANCELLED';

// Staff & Instructor Types
export interface Staff {
  id: string;
  user: User;
  role: StaffRole;
  isInstructor: boolean;
  locations: Location[];
}

export type StaffRole = 'OWNER' | 'ADMIN' | 'MANAGER' | 'INSTRUCTOR' | 'FRONT_DESK';

export interface Instructor {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  bio?: string;
}

export interface InstructorSchedule {
  id: string;
  classSession: ClassSession;
  date: string;
}

// Gamification Types
export interface Badge {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  earnedAt?: string;
}

export interface Challenge {
  id: string;
  name: string;
  description: string;
  type: 'INDIVIDUAL' | 'TEAM';
  goalType: 'CLASSES_ATTENDED' | 'POINTS_EARNED' | 'STREAK_DAYS' | 'CUSTOM';
  goalValue: number;
  currentProgress: number;
  startDate: string;
  endDate: string;
  pointReward: number;
}

export interface PointTransaction {
  id: string;
  points: number;
  reason: string;
  createdAt: string;
}

// Content Types
export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  coverImageUrl?: string;
  category: string;
  tags: string[];
  publishedAt: string;
  isBookmarked: boolean;
  readTime?: number;
  author?: {
    name: string;
    avatarUrl?: string;
  };
  relatedArticles?: Array<{
    id: string;
    title: string;
    coverImageUrl?: string;
    category: string;
  }>;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'INFO' | 'WARNING' | 'URGENT' | 'CELEBRATION';
  publishedAt: string;
  expiresAt?: string;
}

// Video Types
export interface VideoProgram {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  videoCount: number;
  totalDuration: number;
}

export interface Video {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  vimeoId?: string;
  vimeoUrl?: string;
  duration: number;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  isPremium: boolean;
  progress?: VideoProgress;
}

export interface VideoProgress {
  watchedSeconds: number;
  isCompleted: boolean;
  lastWatchedAt: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Navigation Types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  ClassDetails: { classId: string };
  BookingConfirmation: { bookingId: string };
  QRScanner: undefined;
  Profile: undefined;
  Settings: undefined;
  MembershipDetails: { membershipId: string };
  // Content
  ContentFeed: undefined;
  ArticleDetails: { articleId: string };
  // Gamification
  Gamification: undefined;
  AllBadges: undefined;
  BadgeDetails: { badgeId: string };
  AllChallenges: undefined;
  ChallengeDetails: { challengeId: string };
  Leaderboard: undefined;
  PointsHistory: undefined;
  // Video
  VideoLibrary: undefined;
  VideoProgram: { programId: string };
  VideoPlayer: { videoId: string };
  // Instructor
  SubstituteRequests: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type MemberTabParamList = {
  Home: undefined;
  Schedule: undefined;
  Bookings: undefined;
  Profile: undefined;
};

export type InstructorTabParamList = {
  Schedule: undefined;
  Classes: undefined;
  Roster: undefined;
  Pay: undefined;
};
