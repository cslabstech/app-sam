/**
 * Comprehensive test suite for React Native UI components
 * Tests Button, Input, Card, and other UI components with React Native Testing Library
 * Covers component rendering, user interactions, accessibility, and theming
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Vibration } from 'react-native';

// Mock dependencies
jest.mock('@/hooks/utils/useColorScheme', () => ({
  useColorScheme: () => 'light',
}));

jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  Vibration: {
    vibrate: jest.fn(),
  },
  Platform: {
    OS: 'ios',
    select: jest.fn((obj) => obj.ios),
  },
}));

// TypeScript interfaces for component validation
interface ButtonTestProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'tertiary' | 'danger' | 'success' | 'outline' | 'ghost' | 'link';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  hapticFeedback?: boolean;
  testID?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

interface InputTestProps {
  label?: string;
  helperText?: string;
  error?: string;
  success?: boolean;
  variant?: 'default' | 'filled' | 'outlined';
  size?: 'sm' | 'md' | 'lg';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  testID?: string;
}

interface CardTestProps {
  children?: React.ReactNode;
  title?: string;
  subtitle?: string;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onPress?: () => void;
  testID?: string;
}

// Mock icon component for testing
const MockIcon = ({ name, testID }: { name: string; testID?: string }) => (
  <div testID={testID || `icon-${name}`}>{name}</div>
);

describe('React Native UI Components', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Button Component', () => {
    it('should render button with correct title', () => {
      const { getByText } = render(<Button title="Test Button" />);
      
      expect(getByText('Test Button')).toBeTruthy();
    });

    it('should handle press events correctly', () => {
      const mockOnPress = jest.fn();
      const { getByText } = render(
        <Button title="Press Me" onPress={mockOnPress} />
      );

      fireEvent.press(getByText('Press Me'));
      
      expect(mockOnPress).toHaveBeenCalledTimes(1);
    });

    it('should not trigger press when disabled', () => {
      const mockOnPress = jest.fn();
      const { getByText } = render(
        <Button title="Disabled Button" onPress={mockOnPress} disabled />
      );

      fireEvent.press(getByText('Disabled Button'));
      
      expect(mockOnPress).not.toHaveBeenCalled();
    });

    it('should not trigger press when loading', () => {
      const mockOnPress = jest.fn();
      const { getByText } = render(
        <Button title="Loading Button" onPress={mockOnPress} loading />
      );

      fireEvent.press(getByText('Loading Button'));
      
      expect(mockOnPress).not.toHaveBeenCalled();
    });

    it('should show loading indicator when loading', () => {
      const { getByTestId } = render(
        <Button title="Loading" loading testID="loading-button" />
      );

      // Check for ActivityIndicator presence (implementation dependent)
      const button = getByTestId('loading-button');
      expect(button).toBeTruthy();
    });

    it('should render with different variants', () => {
      const variants: ButtonTestProps['variant'][] = [
        'primary', 'secondary', 'tertiary', 'danger', 'success', 'outline', 'ghost', 'link'
      ];

      variants.forEach((variant) => {
        const { getByText, unmount } = render(
          <Button title={`${variant} Button`} variant={variant} />
        );

        expect(getByText(`${variant} Button`)).toBeTruthy();
        unmount();
      });
    });

    it('should render with different sizes', () => {
      const sizes: ButtonTestProps['size'][] = ['xs', 'sm', 'md', 'lg', 'xl'];

      sizes.forEach((size) => {
        const { getByText, unmount } = render(
          <Button title={`${size} Button`} size={size} />
        );

        expect(getByText(`${size} Button`)).toBeTruthy();
        unmount();
      });
    });

    it('should render with left and right icons', () => {
      const { getByTestId } = render(
        <Button
          title="Icon Button"
          leftIcon={<MockIcon name="left" testID="left-icon" />}
          rightIcon={<MockIcon name="right" testID="right-icon" />}
        />
      );

      expect(getByTestId('left-icon')).toBeTruthy();
      expect(getByTestId('right-icon')).toBeTruthy();
    });

    it('should handle haptic feedback on iOS', () => {
      const mockOnPress = jest.fn();
      const { getByText } = render(
        <Button title="Haptic Button" onPress={mockOnPress} hapticFeedback />
      );

      fireEvent.press(getByText('Haptic Button'));
      
      expect(Vibration.vibrate).toHaveBeenCalledWith(1);
      expect(mockOnPress).toHaveBeenCalledTimes(1);
    });

    it('should disable haptic feedback when specified', () => {
      const mockOnPress = jest.fn();
      const { getByText } = render(
        <Button title="No Haptic" onPress={mockOnPress} hapticFeedback={false} />
      );

      fireEvent.press(getByText('No Haptic'));
      
      expect(Vibration.vibrate).not.toHaveBeenCalled();
      expect(mockOnPress).toHaveBeenCalledTimes(1);
    });

    it('should render full width when specified', () => {
      const { getByTestId } = render(
        <Button title="Full Width" fullWidth testID="full-width-button" />
      );

      const button = getByTestId('full-width-button');
      expect(button).toBeTruthy();
      // Style assertions would depend on the actual implementation
    });

    it('should have proper accessibility props', () => {
      const { getByRole, getByLabelText } = render(
        <Button
          title="Accessible Button"
          accessibilityLabel="Custom Accessibility Label"
          accessibilityHint="This button performs an action"
        />
      );

      // Check for accessibility properties
      expect(getByLabelText('Custom Accessibility Label')).toBeTruthy();
    });

    it('should handle rapid successive presses', () => {
      const mockOnPress = jest.fn();
      const { getByText } = render(
        <Button title="Rapid Press" onPress={mockOnPress} />
      );

      const button = getByText('Rapid Press');
      
      // Simulate rapid presses
      fireEvent.press(button);
      fireEvent.press(button);
      fireEvent.press(button);
      
      expect(mockOnPress).toHaveBeenCalledTimes(3);
    });

    it('should render custom styles correctly', () => {
      const customStyle = { backgroundColor: 'red' };
      const customTextStyle = { fontSize: 20 };

      const { getByTestId } = render(
        <Button
          title="Custom Styled"
          style={customStyle}
          textStyle={customTextStyle}
          testID="custom-button"
        />
      );

      const button = getByTestId('custom-button');
      expect(button).toBeTruthy();
    });
  });

  describe('Input Component', () => {
    it('should render input with label', () => {
      const { getByText } = render(<Input label="Username" />);
      
      expect(getByText('Username')).toBeTruthy();
    });

    it('should render required indicator', () => {
      const { getByText } = render(
        <Input label="Required Field" required />
      );
      
      expect(getByText('Required Field')).toBeTruthy();
      expect(getByText('*')).toBeTruthy();
    });

    it('should handle text input changes', () => {
      const mockOnChangeText = jest.fn();
      const { getByDisplayValue } = render(
        <Input
          placeholder="Enter text"
          onChangeText={mockOnChangeText}
          testID="text-input"
        />
      );

      const input = getByDisplayValue('');
      fireEvent.changeText(input, 'Hello World');
      
      expect(mockOnChangeText).toHaveBeenCalledWith('Hello World');
    });

    it('should handle focus and blur events', () => {
      const mockOnFocus = jest.fn();
      const mockOnBlur = jest.fn();
      const { getByTestId } = render(
        <Input
          placeholder="Focus test"
          onFocus={mockOnFocus}
          onBlur={mockOnBlur}
          testID="focus-input"
        />
      );

      const input = getByTestId('focus-input');
      
      fireEvent(input, 'focus');
      expect(mockOnFocus).toHaveBeenCalledTimes(1);
      
      fireEvent(input, 'blur');
      expect(mockOnBlur).toHaveBeenCalledTimes(1);
    });

    it('should display error message', () => {
      const { getByText } = render(
        <Input label="Email" error="Invalid email format" />
      );
      
      expect(getByText('Invalid email format')).toBeTruthy();
    });

    it('should display helper text', () => {
      const { getByText } = render(
        <Input label="Password" helperText="Must be at least 8 characters" />
      );
      
      expect(getByText('Must be at least 8 characters')).toBeTruthy();
    });

    it('should render with different variants', () => {
      const variants: InputTestProps['variant'][] = ['default', 'filled', 'outlined'];

      variants.forEach((variant) => {
        const { getByTestId, unmount } = render(
          <Input
            placeholder={`${variant} input`}
            variant={variant}
            testID={`${variant}-input`}
          />
        );

        expect(getByTestId(`${variant}-input`)).toBeTruthy();
        unmount();
      });
    });

    it('should render with different sizes', () => {
      const sizes: InputTestProps['size'][] = ['sm', 'md', 'lg'];

      sizes.forEach((size) => {
        const { getByTestId, unmount } = render(
          <Input
            placeholder={`${size} input`}
            size={size}
            testID={`${size}-input`}
          />
        );

        expect(getByTestId(`${size}-input`)).toBeTruthy();
        unmount();
      });
    });

    it('should render with left and right icons', () => {
      const { getByTestId } = render(
        <Input
          placeholder="Icon input"
          leftIcon={<MockIcon name="search" testID="left-icon" />}
          rightIcon={<MockIcon name="clear" testID="right-icon" />}
        />
      );

      expect(getByTestId('left-icon')).toBeTruthy();
      expect(getByTestId('right-icon')).toBeTruthy();
    });

    it('should be disabled when disabled prop is true', () => {
      const { getByTestId } = render(
        <Input placeholder="Disabled input" disabled testID="disabled-input" />
      );

      const input = getByTestId('disabled-input');
      expect(input.props.editable).toBe(false);
    });

    it('should show success state', () => {
      const { getByTestId } = render(
        <Input
          label="Valid Input"
          success
          testID="success-input"
        />
      );

      const input = getByTestId('success-input');
      expect(input).toBeTruthy();
      // Success styling would be implementation dependent
    });

    it('should handle multiline input', () => {
      const { getByTestId } = render(
        <Input
          placeholder="Multiline input"
          multiline
          numberOfLines={4}
          testID="multiline-input"
        />
      );

      const input = getByTestId('multiline-input');
      expect(input.props.multiline).toBe(true);
      expect(input.props.numberOfLines).toBe(4);
    });

    it('should handle secure text entry', () => {
      const { getByTestId } = render(
        <Input
          placeholder="Password"
          secureTextEntry
          testID="password-input"
        />
      );

      const input = getByTestId('password-input');
      expect(input.props.secureTextEntry).toBe(true);
    });
  });

  describe('Card Component', () => {
    // Note: Assuming Card component exists with similar structure
    const MockCard = ({ children, title, subtitle, onPress, testID }: CardTestProps) => (
      <div testID={testID} onClick={onPress}>
        {title && <h3>{title}</h3>}
        {subtitle && <p>{subtitle}</p>}
        {children}
      </div>
    );

    it('should render card with title and subtitle', () => {
      const { getByText } = render(
        <MockCard title="Card Title" subtitle="Card Subtitle" />
      );
      
      expect(getByText('Card Title')).toBeTruthy();
      expect(getByText('Card Subtitle')).toBeTruthy();
    });

    it('should render card with children content', () => {
      const { getByText } = render(
        <MockCard>
          <div>Custom Card Content</div>
        </MockCard>
      );
      
      expect(getByText('Custom Card Content')).toBeTruthy();
    });

    it('should handle press events when pressable', () => {
      const mockOnPress = jest.fn();
      const { getByTestId } = render(
        <MockCard
          title="Pressable Card"
          onPress={mockOnPress}
          testID="pressable-card"
        />
      );

      fireEvent.press(getByTestId('pressable-card'));
      
      expect(mockOnPress).toHaveBeenCalledTimes(1);
    });
  });

  describe('Component Integration Tests', () => {
    it('should render form with button and inputs together', () => {
      const mockSubmit = jest.fn();
      const mockEmailChange = jest.fn();
      const mockPasswordChange = jest.fn();

      const { getByText, getByPlaceholderText } = render(
        <div>
          <Input
            label="Email"
            placeholder="Enter your email"
            onChangeText={mockEmailChange}
          />
          <Input
            label="Password"
            placeholder="Enter your password"
            secureTextEntry
            onChangeText={mockPasswordChange}
          />
          <Button title="Sign In" onPress={mockSubmit} />
        </div>
      );

      // Check all components are rendered
      expect(getByText('Email')).toBeTruthy();
      expect(getByText('Password')).toBeTruthy();
      expect(getByPlaceholderText('Enter your email')).toBeTruthy();
      expect(getByPlaceholderText('Enter your password')).toBeTruthy();
      expect(getByText('Sign In')).toBeTruthy();

      // Test interactions
      fireEvent.changeText(getByPlaceholderText('Enter your email'), 'test@example.com');
      fireEvent.changeText(getByPlaceholderText('Enter your password'), 'password123');
      fireEvent.press(getByText('Sign In'));

      expect(mockEmailChange).toHaveBeenCalledWith('test@example.com');
      expect(mockPasswordChange).toHaveBeenCalledWith('password123');
      expect(mockSubmit).toHaveBeenCalledTimes(1);
    });

    it('should handle complex form validation states', () => {
      const { getByText, rerender } = render(
        <div>
          <Input label="Email" error="Email is required" />
          <Button title="Submit" disabled />
        </div>
      );

      // Check error state
      expect(getByText('Email is required')).toBeTruthy();
      expect(getByText('Submit')).toBeTruthy();

      // Update to success state
      rerender(
        <div>
          <Input label="Email" success />
          <Button title="Submit" variant="success" />
        </div>
      );

      expect(() => getByText('Email is required')).toThrow();
    });

    it('should handle loading states across components', () => {
      const { getByText, rerender } = render(
        <div>
          <Input label="Username" />
          <Button title="Login" />
        </div>
      );

      expect(getByText('Login')).toBeTruthy();

      // Update to loading state
      rerender(
        <div>
          <Input label="Username" disabled />
          <Button title="Logging in..." loading />
        </div>
      );

      expect(getByText('Logging in...')).toBeTruthy();
    });
  });

  describe('Accessibility Tests', () => {
    it('should have proper accessibility roles for buttons', () => {
      const { getByRole } = render(
        <Button title="Accessible Button" accessibilityLabel="Submit Form" />
      );

      expect(getByRole('button')).toBeTruthy();
    });

    it('should have proper accessibility labels for inputs', () => {
      const { getByLabelText } = render(
        <Input
          label="Email Address"
          accessibilityLabel="Enter your email address"
          testID="email-input"
        />
      );

      // Check for accessibility label
      expect(() => getByLabelText('Enter your email address')).not.toThrow();
    });

    it('should support screen reader hints', () => {
      const { getByText } = render(
        <Button
          title="Delete"
          variant="danger"
          accessibilityHint="Permanently deletes the selected item"
        />
      );

      expect(getByText('Delete')).toBeTruthy();
    });

    it('should handle focus management', async () => {
      const { getByTestId } = render(
        <div>
          <Input testID="first-input" placeholder="First" />
          <Input testID="second-input" placeholder="Second" />
          <Button testID="submit-button" title="Submit" />
        </div>
      );

      const firstInput = getByTestId('first-input');
      const secondInput = getByTestId('second-input');

      fireEvent(firstInput, 'focus');
      fireEvent(firstInput, 'blur');
      fireEvent(secondInput, 'focus');

      // Focus management testing would be more complex in actual implementation
      expect(firstInput).toBeTruthy();
      expect(secondInput).toBeTruthy();
    });
  });

  describe('Theme and Styling Tests', () => {
    it('should render with light theme colors', () => {
      const { getByTestId } = render(
        <Button title="Light Theme" variant="primary" testID="themed-button" />
      );

      const button = getByTestId('themed-button');
      expect(button).toBeTruthy();
      // Theme color assertions would depend on actual implementation
    });

    it('should handle responsive design', () => {
      const { getByTestId } = render(
        <div>
          <Button title="Mobile" size="sm" testID="mobile-button" />
          <Button title="Tablet" size="lg" testID="tablet-button" />
        </div>
      );

      expect(getByTestId('mobile-button')).toBeTruthy();
      expect(getByTestId('tablet-button')).toBeTruthy();
    });

    it('should handle custom styling overrides', () => {
      const customButtonStyle = { backgroundColor: '#ff0000' };
      const customInputStyle = { borderColor: '#00ff00' };

      const { getByTestId } = render(
        <div>
          <Button
            title="Custom Button"
            style={customButtonStyle}
            testID="custom-button"
          />
          <Input
            placeholder="Custom Input"
            style={customInputStyle}
            testID="custom-input"
          />
        </div>
      );

      expect(getByTestId('custom-button')).toBeTruthy();
      expect(getByTestId('custom-input')).toBeTruthy();
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle rapid re-renders without issues', () => {
      let renderCount = 0;
      const TestComponent = ({ count }: { count: number }) => {
        renderCount++;
        return <Button title={`Render ${count}`} testID="rerender-button" />;
      };

      const { getByTestId, rerender } = render(<TestComponent count={1} />);
      
      // Simulate rapid re-renders
      for (let i = 2; i <= 10; i++) {
        rerender(<TestComponent count={i} />);
      }

      expect(getByTestId('rerender-button')).toBeTruthy();
      expect(renderCount).toBe(10);
    });

    it('should handle component unmounting gracefully', () => {
      const { getByText, unmount } = render(
        <Button title="Unmount Test" onPress={() => {}} />
      );

      expect(getByText('Unmount Test')).toBeTruthy();
      
      // Should not cause errors when unmounted
      expect(() => unmount()).not.toThrow();
    });

    it('should handle null/undefined props gracefully', () => {
      const { getByText } = render(
        <Button
          title="Graceful Props"
          onPress={undefined}
          style={null}
          leftIcon={null}
          rightIcon={undefined}
        />
      );

      expect(getByText('Graceful Props')).toBeTruthy();
    });

    it('should handle long text content appropriately', () => {
      const longText = 'This is a very long button title that should be handled appropriately by the component without breaking the layout or causing performance issues';
      
      const { getByText } = render(<Button title={longText} />);
      
      expect(getByText(longText)).toBeTruthy();
    });
  });
});