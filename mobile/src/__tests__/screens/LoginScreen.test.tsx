import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { LoginScreen } from '../../screens/auth/LoginScreen';
import { useAuthStore } from '../../store/auth.store';

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

// Mock auth store
jest.mock('../../store/auth.store', () => ({
  useAuthStore: jest.fn(),
}));

const mockedUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;

describe('LoginScreen', () => {
  const mockLogin = jest.fn();
  const mockClearError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseAuthStore.mockReturnValue({
      login: mockLogin,
      isLoading: false,
      error: null,
      clearError: mockClearError,
    } as any);
  });

  describe('rendering', () => {
    it('should render login form', () => {
      const { getByPlaceholderText, getByText } = render(<LoginScreen />);

      expect(getByPlaceholderText('Email')).toBeTruthy();
      expect(getByPlaceholderText('Password')).toBeTruthy();
      expect(getByText('Sign In')).toBeTruthy();
    });

    it('should render logo/title', () => {
      const { getByText } = render(<LoginScreen />);

      expect(getByText('FitStudio')).toBeTruthy();
    });

    it('should render register link', () => {
      const { getByText } = render(<LoginScreen />);

      expect(getByText("Don't have an account?")).toBeTruthy();
      expect(getByText('Sign Up')).toBeTruthy();
    });

    it('should render forgot password link', () => {
      const { getByText } = render(<LoginScreen />);

      expect(getByText('Forgot Password?')).toBeTruthy();
    });
  });

  describe('form validation', () => {
    it('should show error for empty email', async () => {
      const { getByText, getByPlaceholderText } = render(<LoginScreen />);

      fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
      fireEvent.press(getByText('Sign In'));

      await waitFor(() => {
        expect(getByText('Email is required')).toBeTruthy();
      });
    });

    it('should show error for invalid email format', async () => {
      const { getByText, getByPlaceholderText } = render(<LoginScreen />);

      fireEvent.changeText(getByPlaceholderText('Email'), 'invalid-email');
      fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
      fireEvent.press(getByText('Sign In'));

      await waitFor(() => {
        expect(getByText('Invalid email format')).toBeTruthy();
      });
    });

    it('should show error for empty password', async () => {
      const { getByText, getByPlaceholderText } = render(<LoginScreen />);

      fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
      fireEvent.press(getByText('Sign In'));

      await waitFor(() => {
        expect(getByText('Password is required')).toBeTruthy();
      });
    });

    it('should show error for short password', async () => {
      const { getByText, getByPlaceholderText } = render(<LoginScreen />);

      fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
      fireEvent.changeText(getByPlaceholderText('Password'), '123');
      fireEvent.press(getByText('Sign In'));

      await waitFor(() => {
        expect(getByText('Password must be at least 6 characters')).toBeTruthy();
      });
    });
  });

  describe('form submission', () => {
    it('should call login with valid credentials', async () => {
      mockLogin.mockResolvedValue(undefined);

      const { getByText, getByPlaceholderText } = render(<LoginScreen />);

      fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
      fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
      fireEvent.press(getByText('Sign In'));

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
      });
    });

    it('should trim email before submission', async () => {
      mockLogin.mockResolvedValue(undefined);

      const { getByText, getByPlaceholderText } = render(<LoginScreen />);

      fireEvent.changeText(getByPlaceholderText('Email'), '  test@example.com  ');
      fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
      fireEvent.press(getByText('Sign In'));

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
      });
    });
  });

  describe('loading state', () => {
    it('should disable form when loading', () => {
      mockedUseAuthStore.mockReturnValue({
        login: mockLogin,
        isLoading: true,
        error: null,
        clearError: mockClearError,
      } as any);

      const { getByText } = render(<LoginScreen />);

      const signInButton = getByText('Sign In');
      expect(signInButton.parent?.props.disabled).toBe(true);
    });

    it('should show loading indicator', () => {
      mockedUseAuthStore.mockReturnValue({
        login: mockLogin,
        isLoading: true,
        error: null,
        clearError: mockClearError,
      } as any);

      const { getByTestId } = render(<LoginScreen />);

      expect(getByTestId('loading-indicator')).toBeTruthy();
    });
  });

  describe('error handling', () => {
    it('should display auth error', () => {
      mockedUseAuthStore.mockReturnValue({
        login: mockLogin,
        isLoading: false,
        error: 'Invalid credentials',
        clearError: mockClearError,
      } as any);

      const { getByText } = render(<LoginScreen />);

      expect(getByText('Invalid credentials')).toBeTruthy();
    });

    it('should clear error on input change', () => {
      mockedUseAuthStore.mockReturnValue({
        login: mockLogin,
        isLoading: false,
        error: 'Some error',
        clearError: mockClearError,
      } as any);

      const { getByPlaceholderText } = render(<LoginScreen />);

      fireEvent.changeText(getByPlaceholderText('Email'), 'new@example.com');

      expect(mockClearError).toHaveBeenCalled();
    });
  });

  describe('navigation', () => {
    it('should navigate to register screen', () => {
      const { getByText } = render(<LoginScreen />);

      fireEvent.press(getByText('Sign Up'));

      expect(mockNavigate).toHaveBeenCalledWith('Register');
    });

    it('should navigate to forgot password screen', () => {
      const { getByText } = render(<LoginScreen />);

      fireEvent.press(getByText('Forgot Password?'));

      expect(mockNavigate).toHaveBeenCalledWith('ForgotPassword');
    });
  });

  describe('password visibility', () => {
    it('should toggle password visibility', () => {
      const { getByPlaceholderText, getByTestId } = render(<LoginScreen />);

      const passwordInput = getByPlaceholderText('Password');
      expect(passwordInput.props.secureTextEntry).toBe(true);

      fireEvent.press(getByTestId('password-toggle'));

      expect(getByPlaceholderText('Password').props.secureTextEntry).toBe(false);
    });
  });
});
