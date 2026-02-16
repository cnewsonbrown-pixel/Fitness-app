import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { QRScannerScreen } from '../../screens/member/QRScannerScreen';
import { useMemberStore } from '../../store/member.store';
import { Camera } from 'expo-camera';

// Mock navigation
const mockGoBack = jest.fn();
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    goBack: mockGoBack,
    navigate: mockNavigate,
  }),
}));

// Mock Camera
jest.mock('expo-camera', () => ({
  Camera: {
    requestCameraPermissionsAsync: jest.fn(),
  },
}));

// Mock BarCodeScanner
jest.mock('expo-barcode-scanner', () => ({
  BarCodeScanner: jest.fn(() => null),
}));

// Mock member store
jest.mock('../../store/member.store', () => ({
  useMemberStore: jest.fn(),
}));

const mockedCamera = Camera as jest.Mocked<typeof Camera>;
const mockedUseMemberStore = useMemberStore as jest.MockedFunction<typeof useMemberStore>;

describe('QRScannerScreen', () => {
  const mockCheckInWithQR = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockedCamera.requestCameraPermissionsAsync.mockResolvedValue({
      status: 'granted',
      granted: true,
      expires: 'never',
      canAskAgain: true,
    });

    mockedUseMemberStore.mockReturnValue({
      checkInWithQR: mockCheckInWithQR,
    } as any);
  });

  describe('permissions', () => {
    it('should request camera permission on mount', async () => {
      render(<QRScannerScreen />);

      await waitFor(() => {
        expect(mockedCamera.requestCameraPermissionsAsync).toHaveBeenCalled();
      });
    });

    it('should show permission denied message', async () => {
      mockedCamera.requestCameraPermissionsAsync.mockResolvedValue({
        status: 'denied',
        granted: false,
        expires: 'never',
        canAskAgain: true,
      });

      const { getByText } = render(<QRScannerScreen />);

      await waitFor(() => {
        expect(getByText('Camera permission required')).toBeTruthy();
      });
    });

    it('should show request permission button when denied', async () => {
      mockedCamera.requestCameraPermissionsAsync.mockResolvedValue({
        status: 'denied',
        granted: false,
        expires: 'never',
        canAskAgain: true,
      });

      const { getByText } = render(<QRScannerScreen />);

      await waitFor(() => {
        expect(getByText('Grant Permission')).toBeTruthy();
      });
    });
  });

  describe('rendering', () => {
    it('should render header with close button', async () => {
      const { getByTestId } = render(<QRScannerScreen />);

      await waitFor(() => {
        expect(getByTestId('close-button')).toBeTruthy();
      });
    });

    it('should render scan instructions', async () => {
      const { getByText } = render(<QRScannerScreen />);

      await waitFor(() => {
        expect(getByText('Scan QR Code')).toBeTruthy();
        expect(getByText('Point your camera at the check-in QR code')).toBeTruthy();
      });
    });

    it('should render scanner frame', async () => {
      const { getByTestId } = render(<QRScannerScreen />);

      await waitFor(() => {
        expect(getByTestId('scanner-frame')).toBeTruthy();
      });
    });
  });

  describe('scanning', () => {
    it('should process scanned QR code', async () => {
      const mockBooking = {
        id: 'booking-1',
        status: 'CHECKED_IN',
        classSession: {
          classType: { name: 'Yoga Flow' },
        },
      };
      mockCheckInWithQR.mockResolvedValue(mockBooking);

      const { getByTestId } = render(<QRScannerScreen />);

      await waitFor(() => {
        expect(getByTestId('scanner-frame')).toBeTruthy();
      });

      // Simulate QR code scan
      const onBarCodeScanned = jest.fn();
      fireEvent(getByTestId('barcode-scanner'), 'onBarCodeScanned', {
        type: 'qr',
        data: 'check-in-qr-code-data',
      });

      await waitFor(() => {
        expect(mockCheckInWithQR).toHaveBeenCalledWith('check-in-qr-code-data');
      });
    });

    it('should show success message after check-in', async () => {
      const mockBooking = {
        id: 'booking-1',
        status: 'CHECKED_IN',
        classSession: {
          classType: { name: 'Yoga Flow' },
        },
      };
      mockCheckInWithQR.mockResolvedValue(mockBooking);

      const { getByTestId, getByText } = render(<QRScannerScreen />);

      await waitFor(() => {
        expect(getByTestId('scanner-frame')).toBeTruthy();
      });

      // Simulate QR code scan
      fireEvent(getByTestId('barcode-scanner'), 'onBarCodeScanned', {
        type: 'qr',
        data: 'check-in-qr-code-data',
      });

      await waitFor(() => {
        expect(getByText('Check-in successful!')).toBeTruthy();
        expect(getByText('Yoga Flow')).toBeTruthy();
      });
    });

    it('should show error for invalid QR code', async () => {
      mockCheckInWithQR.mockRejectedValue(new Error('Invalid QR code'));

      const { getByTestId, getByText } = render(<QRScannerScreen />);

      await waitFor(() => {
        expect(getByTestId('scanner-frame')).toBeTruthy();
      });

      // Simulate QR code scan
      fireEvent(getByTestId('barcode-scanner'), 'onBarCodeScanned', {
        type: 'qr',
        data: 'invalid-qr-code',
      });

      await waitFor(() => {
        expect(getByText('Invalid QR code')).toBeTruthy();
      });
    });

    it('should show error for no booking found', async () => {
      mockCheckInWithQR.mockRejectedValue(new Error('No booking found'));

      const { getByTestId, getByText } = render(<QRScannerScreen />);

      await waitFor(() => {
        expect(getByTestId('scanner-frame')).toBeTruthy();
      });

      // Simulate QR code scan
      fireEvent(getByTestId('barcode-scanner'), 'onBarCodeScanned', {
        type: 'qr',
        data: 'valid-but-no-booking',
      });

      await waitFor(() => {
        expect(getByText('No booking found')).toBeTruthy();
      });
    });

    it('should prevent double scanning', async () => {
      const mockBooking = {
        id: 'booking-1',
        status: 'CHECKED_IN',
      };
      mockCheckInWithQR.mockResolvedValue(mockBooking);

      const { getByTestId } = render(<QRScannerScreen />);

      await waitFor(() => {
        expect(getByTestId('scanner-frame')).toBeTruthy();
      });

      // Simulate multiple rapid scans
      fireEvent(getByTestId('barcode-scanner'), 'onBarCodeScanned', {
        type: 'qr',
        data: 'qr-code-1',
      });
      fireEvent(getByTestId('barcode-scanner'), 'onBarCodeScanned', {
        type: 'qr',
        data: 'qr-code-1',
      });

      await waitFor(() => {
        // Should only be called once
        expect(mockCheckInWithQR).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('navigation', () => {
    it('should go back when close button pressed', async () => {
      const { getByTestId } = render(<QRScannerScreen />);

      await waitFor(() => {
        expect(getByTestId('close-button')).toBeTruthy();
      });

      fireEvent.press(getByTestId('close-button'));

      expect(mockGoBack).toHaveBeenCalled();
    });

    it('should navigate to booking confirmation after successful check-in', async () => {
      const mockBooking = {
        id: 'booking-1',
        status: 'CHECKED_IN',
      };
      mockCheckInWithQR.mockResolvedValue(mockBooking);

      const { getByTestId, getByText } = render(<QRScannerScreen />);

      await waitFor(() => {
        expect(getByTestId('scanner-frame')).toBeTruthy();
      });

      // Simulate QR code scan
      fireEvent(getByTestId('barcode-scanner'), 'onBarCodeScanned', {
        type: 'qr',
        data: 'check-in-qr-code',
      });

      await waitFor(() => {
        expect(getByText('Check-in successful!')).toBeTruthy();
      });

      // Press continue button
      fireEvent.press(getByText('Continue'));

      expect(mockGoBack).toHaveBeenCalled();
    });
  });

  describe('retry', () => {
    it('should allow retry after error', async () => {
      mockCheckInWithQR.mockRejectedValue(new Error('Network error'));

      const { getByTestId, getByText } = render(<QRScannerScreen />);

      await waitFor(() => {
        expect(getByTestId('scanner-frame')).toBeTruthy();
      });

      // Simulate failed scan
      fireEvent(getByTestId('barcode-scanner'), 'onBarCodeScanned', {
        type: 'qr',
        data: 'qr-code',
      });

      await waitFor(() => {
        expect(getByText('Network error')).toBeTruthy();
      });

      // Press try again
      fireEvent.press(getByText('Try Again'));

      // Scanner should be active again
      expect(getByTestId('scanner-frame')).toBeTruthy();
    });
  });

  describe('loading state', () => {
    it('should show loading indicator during check-in', async () => {
      mockCheckInWithQR.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );

      const { getByTestId } = render(<QRScannerScreen />);

      await waitFor(() => {
        expect(getByTestId('scanner-frame')).toBeTruthy();
      });

      // Simulate QR code scan
      fireEvent(getByTestId('barcode-scanner'), 'onBarCodeScanned', {
        type: 'qr',
        data: 'check-in-qr-code',
      });

      expect(getByTestId('loading-indicator')).toBeTruthy();
    });
  });

  describe('torch/flashlight', () => {
    it('should toggle torch when button pressed', async () => {
      const { getByTestId } = render(<QRScannerScreen />);

      await waitFor(() => {
        expect(getByTestId('torch-button')).toBeTruthy();
      });

      fireEvent.press(getByTestId('torch-button'));

      // Torch should be toggled
      expect(getByTestId('torch-button-active')).toBeTruthy();
    });
  });
});
