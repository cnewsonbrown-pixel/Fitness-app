import * as SecureStore from 'expo-secure-store';
import { useAuthStore } from '../../store/auth.store';
import { authService } from '../../services/auth.service';

// Mock services
jest.mock('../../services/auth.service', () => ({
  authService: {
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    refreshToken: jest.fn(),
    getMe: jest.fn(),
  },
}));

const mockedAuthService = authService as jest.Mocked<typeof authService>;

describe('Auth Store', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset store state
    useAuthStore.setState({
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: false,
      error: null,
    });
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = useAuthStore.getState();

      expect(state.user).toBeNull();
      expect(state.tokens).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.isInitialized).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('initialize', () => {
    it('should initialize with stored tokens', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
      };

      (SecureStore.getItemAsync as jest.Mock)
        .mockResolvedValueOnce('stored-access-token')
        .mockResolvedValueOnce('stored-refresh-token');

      mockedAuthService.getMe.mockResolvedValue(mockUser);

      await useAuthStore.getState().initialize();

      const state = useAuthStore.getState();
      expect(state.isInitialized).toBe(true);
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(mockUser);
    });

    it('should initialize without tokens', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

      await useAuthStore.getState().initialize();

      const state = useAuthStore.getState();
      expect(state.isInitialized).toBe(true);
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
    });

    it('should clear tokens if getMe fails', async () => {
      (SecureStore.getItemAsync as jest.Mock)
        .mockResolvedValueOnce('invalid-token')
        .mockResolvedValueOnce('invalid-refresh');

      mockedAuthService.getMe.mockRejectedValue(new Error('Unauthorized'));

      await useAuthStore.getState().initialize();

      const state = useAuthStore.getState();
      expect(state.isInitialized).toBe(true);
      expect(state.isAuthenticated).toBe(false);
      expect(SecureStore.deleteItemAsync).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should login successfully', async () => {
      const mockResponse = {
        user: {
          id: '1',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
        },
        tokens: {
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
        },
      };

      mockedAuthService.login.mockResolvedValue(mockResponse);

      await useAuthStore.getState().login('test@example.com', 'password123');

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(mockResponse.user);
      expect(state.tokens).toEqual(mockResponse.tokens);
      expect(state.error).toBeNull();
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('accessToken', 'access-token');
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('refreshToken', 'refresh-token');
    });

    it('should handle login error', async () => {
      const error = new Error('Invalid credentials');
      mockedAuthService.login.mockRejectedValue(error);

      await expect(
        useAuthStore.getState().login('test@example.com', 'wrong')
      ).rejects.toThrow('Invalid credentials');

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.error).toBe('Invalid credentials');
    });

    it('should set loading state during login', async () => {
      mockedAuthService.login.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      const loginPromise = useAuthStore.getState().login('test@example.com', 'password');

      // Check loading state immediately
      expect(useAuthStore.getState().isLoading).toBe(true);

      await loginPromise.catch(() => {}); // Handle rejection
    });
  });

  describe('register', () => {
    it('should register successfully', async () => {
      const mockResponse = {
        user: {
          id: '1',
          email: 'new@example.com',
          firstName: 'New',
          lastName: 'User',
        },
        tokens: {
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
        },
      };

      mockedAuthService.register.mockResolvedValue(mockResponse);

      await useAuthStore.getState().register({
        email: 'new@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
      });

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user?.email).toBe('new@example.com');
    });

    it('should handle registration error', async () => {
      mockedAuthService.register.mockRejectedValue(new Error('Email already exists'));

      await expect(
        useAuthStore.getState().register({
          email: 'existing@example.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User',
        })
      ).rejects.toThrow('Email already exists');

      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      // Set up authenticated state
      useAuthStore.setState({
        user: { id: '1', email: 'test@example.com', firstName: 'Test', lastName: 'User' },
        tokens: { accessToken: 'token', refreshToken: 'refresh' },
        isAuthenticated: true,
      });

      mockedAuthService.logout.mockResolvedValue(undefined);

      await useAuthStore.getState().logout();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.tokens).toBeNull();
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('accessToken');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('refreshToken');
    });

    it('should clear state even if API logout fails', async () => {
      useAuthStore.setState({
        user: { id: '1', email: 'test@example.com', firstName: 'Test', lastName: 'User' },
        tokens: { accessToken: 'token', refreshToken: 'refresh' },
        isAuthenticated: true,
      });

      mockedAuthService.logout.mockRejectedValue(new Error('Network error'));

      await useAuthStore.getState().logout();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
    });
  });

  describe('refreshTokens', () => {
    it('should refresh tokens successfully', async () => {
      useAuthStore.setState({
        tokens: { accessToken: 'old-access', refreshToken: 'old-refresh' },
        isAuthenticated: true,
      });

      mockedAuthService.refreshToken.mockResolvedValue({
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
      });

      await useAuthStore.getState().refreshTokens();

      const state = useAuthStore.getState();
      expect(state.tokens?.accessToken).toBe('new-access');
      expect(state.tokens?.refreshToken).toBe('new-refresh');
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('accessToken', 'new-access');
    });

    it('should logout if refresh fails', async () => {
      useAuthStore.setState({
        user: { id: '1', email: 'test@example.com', firstName: 'Test', lastName: 'User' },
        tokens: { accessToken: 'expired', refreshToken: 'expired-refresh' },
        isAuthenticated: true,
      });

      mockedAuthService.refreshToken.mockRejectedValue(new Error('Refresh token expired'));

      await useAuthStore.getState().refreshTokens();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
    });
  });

  describe('clearError', () => {
    it('should clear error state', () => {
      useAuthStore.setState({ error: 'Some error' });

      useAuthStore.getState().clearError();

      expect(useAuthStore.getState().error).toBeNull();
    });
  });
});
