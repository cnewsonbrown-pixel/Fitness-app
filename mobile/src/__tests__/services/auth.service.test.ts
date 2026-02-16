import { authService } from '../../services/auth.service';
import api from '../../services/api';

jest.mock('../../services/api', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    get: jest.fn(),
  },
}));

const mockedApi = api as jest.Mocked<typeof api>;

describe('Auth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should send login request with email and password', async () => {
      const mockResponse = {
        data: {
          data: {
            user: { id: '1', email: 'test@example.com', firstName: 'Test', lastName: 'User' },
            tokens: { accessToken: 'access', refreshToken: 'refresh' },
          },
        },
      };
      mockedApi.post.mockResolvedValue(mockResponse);

      const result = await authService.login('test@example.com', 'password123');

      expect(mockedApi.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'password123',
      });
      expect(result.user.email).toBe('test@example.com');
      expect(result.tokens.accessToken).toBe('access');
    });

    it('should throw error on invalid credentials', async () => {
      mockedApi.post.mockRejectedValue({
        response: { status: 401, data: { message: 'Invalid credentials' } },
      });

      await expect(authService.login('test@example.com', 'wrong')).rejects.toEqual({
        response: { status: 401, data: { message: 'Invalid credentials' } },
      });
    });
  });

  describe('register', () => {
    it('should send register request with user data', async () => {
      const mockResponse = {
        data: {
          data: {
            user: { id: '1', email: 'new@example.com', firstName: 'New', lastName: 'User' },
            tokens: { accessToken: 'access', refreshToken: 'refresh' },
          },
        },
      };
      mockedApi.post.mockResolvedValue(mockResponse);

      const result = await authService.register({
        email: 'new@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
      });

      expect(mockedApi.post).toHaveBeenCalledWith('/auth/register', {
        email: 'new@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
      });
      expect(result.user.email).toBe('new@example.com');
    });

    it('should throw error if email already exists', async () => {
      mockedApi.post.mockRejectedValue({
        response: { status: 409, data: { message: 'Email already exists' } },
      });

      await expect(
        authService.register({
          email: 'existing@example.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User',
        })
      ).rejects.toEqual({
        response: { status: 409, data: { message: 'Email already exists' } },
      });
    });
  });

  describe('refreshToken', () => {
    it('should send refresh token request', async () => {
      const mockResponse = {
        data: {
          data: {
            accessToken: 'new-access',
            refreshToken: 'new-refresh',
          },
        },
      };
      mockedApi.post.mockResolvedValue(mockResponse);

      const result = await authService.refreshToken('old-refresh');

      expect(mockedApi.post).toHaveBeenCalledWith('/auth/refresh', {
        refreshToken: 'old-refresh',
      });
      expect(result.accessToken).toBe('new-access');
    });

    it('should throw error on expired refresh token', async () => {
      mockedApi.post.mockRejectedValue({
        response: { status: 401, data: { message: 'Refresh token expired' } },
      });

      await expect(authService.refreshToken('expired-token')).rejects.toEqual({
        response: { status: 401, data: { message: 'Refresh token expired' } },
      });
    });
  });

  describe('logout', () => {
    it('should send logout request', async () => {
      mockedApi.post.mockResolvedValue({ data: { success: true } });

      await authService.logout();

      expect(mockedApi.post).toHaveBeenCalledWith('/auth/logout');
    });
  });

  describe('getMe', () => {
    it('should fetch current user', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
      };
      mockedApi.get.mockResolvedValue({ data: { data: mockUser } });

      const result = await authService.getMe();

      expect(mockedApi.get).toHaveBeenCalledWith('/auth/me');
      expect(result.email).toBe('test@example.com');
    });

    it('should throw error if not authenticated', async () => {
      mockedApi.get.mockRejectedValue({
        response: { status: 401, data: { message: 'Not authenticated' } },
      });

      await expect(authService.getMe()).rejects.toEqual({
        response: { status: 401, data: { message: 'Not authenticated' } },
      });
    });
  });
});
