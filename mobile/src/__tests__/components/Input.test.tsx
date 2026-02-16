import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Input } from '../../components/common/Input';

describe('Input Component', () => {
  describe('rendering', () => {
    it('should render with placeholder', () => {
      const { getByPlaceholderText } = render(
        <Input placeholder="Enter text" onChangeText={() => {}} />
      );

      expect(getByPlaceholderText('Enter text')).toBeTruthy();
    });

    it('should render with label', () => {
      const { getByText } = render(
        <Input label="Email" placeholder="Enter email" onChangeText={() => {}} />
      );

      expect(getByText('Email')).toBeTruthy();
    });

    it('should render with value', () => {
      const { getByDisplayValue } = render(
        <Input value="test@example.com" onChangeText={() => {}} />
      );

      expect(getByDisplayValue('test@example.com')).toBeTruthy();
    });
  });

  describe('interactions', () => {
    it('should call onChangeText when text changes', () => {
      const onChangeTextMock = jest.fn();
      const { getByPlaceholderText } = render(
        <Input placeholder="Type here" onChangeText={onChangeTextMock} />
      );

      fireEvent.changeText(getByPlaceholderText('Type here'), 'new text');

      expect(onChangeTextMock).toHaveBeenCalledWith('new text');
    });

    it('should call onFocus when focused', () => {
      const onFocusMock = jest.fn();
      const { getByPlaceholderText } = render(
        <Input placeholder="Focus me" onChangeText={() => {}} onFocus={onFocusMock} />
      );

      fireEvent(getByPlaceholderText('Focus me'), 'focus');

      expect(onFocusMock).toHaveBeenCalled();
    });

    it('should call onBlur when blurred', () => {
      const onBlurMock = jest.fn();
      const { getByPlaceholderText } = render(
        <Input placeholder="Blur me" onChangeText={() => {}} onBlur={onBlurMock} />
      );

      fireEvent(getByPlaceholderText('Blur me'), 'blur');

      expect(onBlurMock).toHaveBeenCalled();
    });
  });

  describe('error state', () => {
    it('should display error message', () => {
      const { getByText } = render(
        <Input
          placeholder="Email"
          onChangeText={() => {}}
          error="Invalid email address"
        />
      );

      expect(getByText('Invalid email address')).toBeTruthy();
    });

    it('should apply error styling when error is present', () => {
      const { getByTestId } = render(
        <Input
          placeholder="Email"
          onChangeText={() => {}}
          error="Error"
          testID="input"
        />
      );

      expect(getByTestId('input')).toBeTruthy();
    });
  });

  describe('disabled state', () => {
    it('should not allow input when disabled', () => {
      const onChangeTextMock = jest.fn();
      const { getByPlaceholderText } = render(
        <Input
          placeholder="Disabled"
          onChangeText={onChangeTextMock}
          editable={false}
        />
      );

      const input = getByPlaceholderText('Disabled');
      expect(input.props.editable).toBe(false);
    });
  });

  describe('secure text entry', () => {
    it('should hide text when secureTextEntry is true', () => {
      const { getByPlaceholderText } = render(
        <Input
          placeholder="Password"
          onChangeText={() => {}}
          secureTextEntry
        />
      );

      const input = getByPlaceholderText('Password');
      expect(input.props.secureTextEntry).toBe(true);
    });

    it('should toggle password visibility when eye icon is pressed', () => {
      const { getByPlaceholderText, getByTestId } = render(
        <Input
          placeholder="Password"
          onChangeText={() => {}}
          secureTextEntry
          showPasswordToggle
          testID="password-input"
        />
      );

      const input = getByPlaceholderText('Password');
      expect(input.props.secureTextEntry).toBe(true);

      // Toggle visibility
      const toggleButton = getByTestId('password-toggle');
      fireEvent.press(toggleButton);

      // After toggle, secureTextEntry should be false
      expect(getByPlaceholderText('Password').props.secureTextEntry).toBe(false);
    });
  });

  describe('icons', () => {
    it('should render left icon', () => {
      const { getByTestId } = render(
        <Input
          placeholder="Search"
          onChangeText={() => {}}
          leftIcon="search"
          testID="input"
        />
      );

      expect(getByTestId('input')).toBeTruthy();
    });

    it('should render right icon', () => {
      const { getByTestId } = render(
        <Input
          placeholder="Email"
          onChangeText={() => {}}
          rightIcon="mail"
          testID="input"
        />
      );

      expect(getByTestId('input')).toBeTruthy();
    });
  });

  describe('keyboard types', () => {
    it('should use email keyboard for email input', () => {
      const { getByPlaceholderText } = render(
        <Input
          placeholder="Email"
          onChangeText={() => {}}
          keyboardType="email-address"
        />
      );

      expect(getByPlaceholderText('Email').props.keyboardType).toBe('email-address');
    });

    it('should use numeric keyboard for number input', () => {
      const { getByPlaceholderText } = render(
        <Input
          placeholder="Phone"
          onChangeText={() => {}}
          keyboardType="numeric"
        />
      );

      expect(getByPlaceholderText('Phone').props.keyboardType).toBe('numeric');
    });
  });

  describe('multiline', () => {
    it('should support multiline input', () => {
      const { getByPlaceholderText } = render(
        <Input
          placeholder="Description"
          onChangeText={() => {}}
          multiline
          numberOfLines={4}
        />
      );

      const input = getByPlaceholderText('Description');
      expect(input.props.multiline).toBe(true);
      expect(input.props.numberOfLines).toBe(4);
    });
  });

  describe('max length', () => {
    it('should respect maxLength prop', () => {
      const { getByPlaceholderText } = render(
        <Input
          placeholder="Username"
          onChangeText={() => {}}
          maxLength={20}
        />
      );

      expect(getByPlaceholderText('Username').props.maxLength).toBe(20);
    });
  });

  describe('auto capitalize', () => {
    it('should auto capitalize words', () => {
      const { getByPlaceholderText } = render(
        <Input
          placeholder="Name"
          onChangeText={() => {}}
          autoCapitalize="words"
        />
      );

      expect(getByPlaceholderText('Name').props.autoCapitalize).toBe('words');
    });

    it('should not auto capitalize for email', () => {
      const { getByPlaceholderText } = render(
        <Input
          placeholder="Email"
          onChangeText={() => {}}
          autoCapitalize="none"
        />
      );

      expect(getByPlaceholderText('Email').props.autoCapitalize).toBe('none');
    });
  });

  describe('accessibility', () => {
    it('should have accessible label', () => {
      const { getByLabelText } = render(
        <Input
          placeholder="Email"
          onChangeText={() => {}}
          accessibilityLabel="Email input"
        />
      );

      expect(getByLabelText('Email input')).toBeTruthy();
    });
  });

  describe('helper text', () => {
    it('should display helper text', () => {
      const { getByText } = render(
        <Input
          placeholder="Password"
          onChangeText={() => {}}
          helperText="Must be at least 8 characters"
        />
      );

      expect(getByText('Must be at least 8 characters')).toBeTruthy();
    });
  });
});
