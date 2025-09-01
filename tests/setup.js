import '@testing-library/jest-native/extend-expect';
import { server } from './mocks/server'; // Re-enabled MSW v2 server with comprehensive coverage

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock Expo modules
jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {
      baseUrl: 'https://sam.rizqis.com',
    },
  },
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    replace: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
  Link: ({ children }) => children,
}));

// Mock React Native modules
// jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper'); // Removed due to compatibility issues
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

// Mock OneSignal
jest.mock('react-native-onesignal', () => ({
  setNotificationWillShowInForegroundHandler: jest.fn(),
  setNotificationOpenedHandler: jest.fn(),
  setInAppMessageClickHandler: jest.fn(),
  addEmailSubscriptionObserver: jest.fn(),
  addSubscriptionObserver: jest.fn(),
  addPermissionObserver: jest.fn(),
  getDeviceState: jest.fn(() => Promise.resolve({ userId: 'test-user-id' })),
}));

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(() => Promise.resolve({ isConnected: true })),
  addEventListener: jest.fn(() => jest.fn()),
}));

// MSW Setup - Re-enabled with MSW v2 comprehensive endpoint coverage
beforeAll(() => {
  // Start the mock server with comprehensive API endpoint coverage
  server.listen({
    onUnhandledRequest: 'warn', // Warn about unhandled requests instead of erroring
  });
});

afterEach(() => {
  // Reset handlers after each test
  server.resetHandlers();
});

afterAll(() => {
  // Clean up after all tests
  server.close();
});

// Global test utilities
global.fetch = require('node-fetch');

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// Setup test environment variables
process.env.EXPO_PUBLIC_BASE_URL = 'https://sam.rizqis.com';