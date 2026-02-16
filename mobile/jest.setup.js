import '@testing-library/jest-native/extend-expect';

// Mock expo modules
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  getExpoPushTokenAsync: jest.fn().mockResolvedValue({ data: 'test-token' }),
  setNotificationHandler: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  setBadgeCountAsync: jest.fn(),
  getBadgeCountAsync: jest.fn().mockResolvedValue(0),
}));

jest.mock('expo-device', () => ({
  isDevice: true,
}));

jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {
      eas: { projectId: 'test-project-id' },
    },
  },
}));

jest.mock('expo-camera', () => ({
  Camera: {
    requestCameraPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  },
}));

jest.mock('expo-barcode-scanner', () => ({
  BarCodeScanner: {
    requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
    Constants: {
      BarCodeType: {
        qr: 'qr',
      },
    },
  },
}));

jest.mock('expo-av', () => ({
  Video: jest.fn(),
  ResizeMode: {
    CONTAIN: 'contain',
  },
}));

jest.mock('expo-screen-orientation', () => ({
  lockAsync: jest.fn(),
  OrientationLock: {
    PORTRAIT_UP: 1,
    LANDSCAPE: 2,
  },
}));

jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
      push: jest.fn(),
    }),
    useRoute: () => ({
      params: {},
    }),
  };
});

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Silence React Native warnings in tests
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Global fetch mock
global.fetch = jest.fn();

// Console error suppression for known issues
const originalError = console.error;
console.error = (...args) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Warning: ReactDOM.render') ||
      args[0].includes('Warning: An update to'))
  ) {
    return;
  }
  originalError.call(console, ...args);
};
