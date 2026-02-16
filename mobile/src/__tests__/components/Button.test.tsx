import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../../components/common/Button';

describe('Button Component', () => {
  describe('rendering', () => {
    it('should render with title', () => {
      const { getByText } = render(<Button title="Click Me" onPress={() => {}} />);

      expect(getByText('Click Me')).toBeTruthy();
    });

    it('should render children instead of title', () => {
      const { getByText } = render(
        <Button onPress={() => {}}>
          Custom Content
        </Button>
      );

      expect(getByText('Custom Content')).toBeTruthy();
    });
  });

  describe('variants', () => {
    it('should render primary variant by default', () => {
      const { getByTestId } = render(
        <Button title="Primary" onPress={() => {}} testID="button" />
      );

      const button = getByTestId('button');
      expect(button).toBeTruthy();
    });

    it('should render secondary variant', () => {
      const { getByTestId } = render(
        <Button title="Secondary" variant="secondary" onPress={() => {}} testID="button" />
      );

      expect(getByTestId('button')).toBeTruthy();
    });

    it('should render outline variant', () => {
      const { getByTestId } = render(
        <Button title="Outline" variant="outline" onPress={() => {}} testID="button" />
      );

      expect(getByTestId('button')).toBeTruthy();
    });

    it('should render ghost variant', () => {
      const { getByTestId } = render(
        <Button title="Ghost" variant="ghost" onPress={() => {}} testID="button" />
      );

      expect(getByTestId('button')).toBeTruthy();
    });

    it('should render danger variant', () => {
      const { getByTestId } = render(
        <Button title="Danger" variant="danger" onPress={() => {}} testID="button" />
      );

      expect(getByTestId('button')).toBeTruthy();
    });
  });

  describe('sizes', () => {
    it('should render small size', () => {
      const { getByText } = render(
        <Button title="Small" size="small" onPress={() => {}} />
      );

      expect(getByText('Small')).toBeTruthy();
    });

    it('should render medium size by default', () => {
      const { getByText } = render(<Button title="Medium" onPress={() => {}} />);

      expect(getByText('Medium')).toBeTruthy();
    });

    it('should render large size', () => {
      const { getByText } = render(
        <Button title="Large" size="large" onPress={() => {}} />
      );

      expect(getByText('Large')).toBeTruthy();
    });
  });

  describe('interactions', () => {
    it('should call onPress when pressed', () => {
      const onPressMock = jest.fn();
      const { getByText } = render(<Button title="Press Me" onPress={onPressMock} />);

      fireEvent.press(getByText('Press Me'));

      expect(onPressMock).toHaveBeenCalledTimes(1);
    });

    it('should not call onPress when disabled', () => {
      const onPressMock = jest.fn();
      const { getByText } = render(
        <Button title="Disabled" onPress={onPressMock} disabled />
      );

      fireEvent.press(getByText('Disabled'));

      expect(onPressMock).not.toHaveBeenCalled();
    });

    it('should not call onPress when loading', () => {
      const onPressMock = jest.fn();
      const { getByTestId } = render(
        <Button title="Loading" onPress={onPressMock} loading testID="button" />
      );

      fireEvent.press(getByTestId('button'));

      expect(onPressMock).not.toHaveBeenCalled();
    });
  });

  describe('loading state', () => {
    it('should show loading indicator when loading', () => {
      const { getByTestId, queryByText } = render(
        <Button title="Loading" onPress={() => {}} loading testID="button" />
      );

      expect(getByTestId('button')).toBeTruthy();
      // Title should be hidden when loading
      expect(queryByText('Loading')).toBeFalsy();
    });
  });

  describe('icons', () => {
    it('should render with left icon', () => {
      const { getByTestId } = render(
        <Button
          title="With Icon"
          onPress={() => {}}
          leftIcon="add"
          testID="button"
        />
      );

      expect(getByTestId('button')).toBeTruthy();
    });

    it('should render with right icon', () => {
      const { getByTestId } = render(
        <Button
          title="With Icon"
          onPress={() => {}}
          rightIcon="arrow-forward"
          testID="button"
        />
      );

      expect(getByTestId('button')).toBeTruthy();
    });
  });

  describe('full width', () => {
    it('should render full width when specified', () => {
      const { getByTestId } = render(
        <Button title="Full Width" onPress={() => {}} fullWidth testID="button" />
      );

      expect(getByTestId('button')).toBeTruthy();
    });
  });

  describe('accessibility', () => {
    it('should have accessible label', () => {
      const { getByLabelText } = render(
        <Button
          title="Accessible Button"
          onPress={() => {}}
          accessibilityLabel="Accessible Button"
        />
      );

      expect(getByLabelText('Accessible Button')).toBeTruthy();
    });

    it('should indicate disabled state for accessibility', () => {
      const { getByRole } = render(
        <Button title="Disabled" onPress={() => {}} disabled accessibilityRole="button" />
      );

      const button = getByRole('button');
      expect(button.props.accessibilityState?.disabled).toBe(true);
    });
  });
});
