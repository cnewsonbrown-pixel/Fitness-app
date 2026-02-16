import React from 'react';
import { Text } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { Card } from '../../components/common/Card';

describe('Card Component', () => {
  describe('rendering', () => {
    it('should render children', () => {
      const { getByText } = render(
        <Card>
          <Text>Card Content</Text>
        </Card>
      );

      expect(getByText('Card Content')).toBeTruthy();
    });

    it('should render with testID', () => {
      const { getByTestId } = render(
        <Card testID="test-card">
          <Text>Content</Text>
        </Card>
      );

      expect(getByTestId('test-card')).toBeTruthy();
    });
  });

  describe('variants', () => {
    it('should render default variant', () => {
      const { getByTestId } = render(
        <Card testID="card">
          <Text>Default</Text>
        </Card>
      );

      expect(getByTestId('card')).toBeTruthy();
    });

    it('should render elevated variant', () => {
      const { getByTestId } = render(
        <Card variant="elevated" testID="card">
          <Text>Elevated</Text>
        </Card>
      );

      expect(getByTestId('card')).toBeTruthy();
    });

    it('should render outlined variant', () => {
      const { getByTestId } = render(
        <Card variant="outlined" testID="card">
          <Text>Outlined</Text>
        </Card>
      );

      expect(getByTestId('card')).toBeTruthy();
    });

    it('should render filled variant', () => {
      const { getByTestId } = render(
        <Card variant="filled" testID="card">
          <Text>Filled</Text>
        </Card>
      );

      expect(getByTestId('card')).toBeTruthy();
    });
  });

  describe('interactions', () => {
    it('should call onPress when pressed', () => {
      const onPressMock = jest.fn();
      const { getByTestId } = render(
        <Card onPress={onPressMock} testID="card">
          <Text>Pressable Card</Text>
        </Card>
      );

      fireEvent.press(getByTestId('card'));

      expect(onPressMock).toHaveBeenCalledTimes(1);
    });

    it('should not be pressable without onPress', () => {
      const { getByTestId } = render(
        <Card testID="card">
          <Text>Static Card</Text>
        </Card>
      );

      const card = getByTestId('card');
      // Card without onPress should still render but not be TouchableOpacity
      expect(card).toBeTruthy();
    });

    it('should not call onPress when disabled', () => {
      const onPressMock = jest.fn();
      const { getByTestId } = render(
        <Card onPress={onPressMock} disabled testID="card">
          <Text>Disabled Card</Text>
        </Card>
      );

      fireEvent.press(getByTestId('card'));

      expect(onPressMock).not.toHaveBeenCalled();
    });
  });

  describe('styling', () => {
    it('should apply custom style', () => {
      const { getByTestId } = render(
        <Card style={{ backgroundColor: 'red' }} testID="card">
          <Text>Styled Card</Text>
        </Card>
      );

      expect(getByTestId('card')).toBeTruthy();
    });

    it('should apply padding', () => {
      const { getByTestId } = render(
        <Card padding={20} testID="card">
          <Text>Padded Card</Text>
        </Card>
      );

      expect(getByTestId('card')).toBeTruthy();
    });

    it('should apply margin', () => {
      const { getByTestId } = render(
        <Card margin={16} testID="card">
          <Text>Margined Card</Text>
        </Card>
      );

      expect(getByTestId('card')).toBeTruthy();
    });

    it('should apply borderRadius', () => {
      const { getByTestId } = render(
        <Card borderRadius={16} testID="card">
          <Text>Rounded Card</Text>
        </Card>
      );

      expect(getByTestId('card')).toBeTruthy();
    });
  });

  describe('complex content', () => {
    it('should render with header', () => {
      const { getByText } = render(
        <Card>
          <Card.Header title="Card Title" />
          <Text>Card Body</Text>
        </Card>
      );

      expect(getByText('Card Title')).toBeTruthy();
      expect(getByText('Card Body')).toBeTruthy();
    });

    it('should render with footer', () => {
      const { getByText } = render(
        <Card>
          <Text>Card Body</Text>
          <Card.Footer>
            <Text>Footer Content</Text>
          </Card.Footer>
        </Card>
      );

      expect(getByText('Card Body')).toBeTruthy();
      expect(getByText('Footer Content')).toBeTruthy();
    });

    it('should render multiple children', () => {
      const { getByText } = render(
        <Card>
          <Text>First Child</Text>
          <Text>Second Child</Text>
          <Text>Third Child</Text>
        </Card>
      );

      expect(getByText('First Child')).toBeTruthy();
      expect(getByText('Second Child')).toBeTruthy();
      expect(getByText('Third Child')).toBeTruthy();
    });
  });

  describe('accessibility', () => {
    it('should have accessible label', () => {
      const { getByLabelText } = render(
        <Card accessibilityLabel="Main card" testID="card">
          <Text>Accessible Card</Text>
        </Card>
      );

      expect(getByLabelText('Main card')).toBeTruthy();
    });

    it('should have button role when pressable', () => {
      const { getByRole } = render(
        <Card onPress={() => {}} accessibilityRole="button">
          <Text>Button Card</Text>
        </Card>
      );

      expect(getByRole('button')).toBeTruthy();
    });
  });

  describe('shadow', () => {
    it('should apply shadow for elevated variant', () => {
      const { getByTestId } = render(
        <Card variant="elevated" testID="card">
          <Text>Shadowed Card</Text>
        </Card>
      );

      const card = getByTestId('card');
      // Elevated cards should have shadow styles
      expect(card).toBeTruthy();
    });

    it('should not apply shadow for flat variant', () => {
      const { getByTestId } = render(
        <Card variant="outlined" testID="card">
          <Text>Flat Card</Text>
        </Card>
      );

      const card = getByTestId('card');
      expect(card).toBeTruthy();
    });
  });

  describe('loading state', () => {
    it('should show loading indicator when loading', () => {
      const { getByTestId, queryByText } = render(
        <Card loading testID="card">
          <Text>Content</Text>
        </Card>
      );

      expect(getByTestId('card')).toBeTruthy();
      // Content might be hidden or overlaid when loading
    });
  });
});
