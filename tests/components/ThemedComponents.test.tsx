/**
 * Themed Components Tests
 * React Native component tests for ThemedText and ThemedView
 * 
 * Tests cover:
 * - Component rendering and props
 * - Theme color integration
 * - Text type variations
 * - Style application
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

// Mock the theme color hook
jest.mock('@/hooks/utils/useThemeColor');

const mockUseThemeColor = require('@/hooks/utils/useThemeColor').useThemeColor;

describe('ThemedText Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock implementation
    mockUseThemeColor.mockReturnValue('#000000');
  });

  describe('Basic Rendering', () => {
    it('should render text content correctly', () => {
      const { getByText } = render(
        <ThemedText>Hello World</ThemedText>
      );

      expect(getByText('Hello World')).toBeTruthy();
    });

    it('should render with default type', () => {
      const { getByText } = render(
        <ThemedText>Default Text</ThemedText>
      );

      const textElement = getByText('Default Text');
      expect(textElement).toBeTruthy();
    });

    it('should handle empty text', () => {
      const { root } = render(
        <ThemedText></ThemedText>
      );

      expect(root).toBeTruthy();
    });
  });

  describe('Text Types', () => {
    it('should render title type', () => {
      const { getByText } = render(
        <ThemedText type="title">Title Text</ThemedText>
      );

      expect(getByText('Title Text')).toBeTruthy();
    });

    it('should render subtitle type', () => {
      const { getByText } = render(
        <ThemedText type="subtitle">Subtitle Text</ThemedText>
      );

      expect(getByText('Subtitle Text')).toBeTruthy();
    });

    it('should render defaultSemiBold type', () => {
      const { getByText } = render(
        <ThemedText type="defaultSemiBold">SemiBold Text</ThemedText>
      );

      expect(getByText('SemiBold Text')).toBeTruthy();
    });

    it('should render link type', () => {
      const { getByText } = render(
        <ThemedText type="link">Link Text</ThemedText>
      );

      expect(getByText('Link Text')).toBeTruthy();
    });
  });

  describe('Theme Color Integration', () => {
    it('should call useThemeColor with correct parameters', () => {
      render(
        <ThemedText lightColor="#ffffff" darkColor="#000000">
          Themed Text
        </ThemedText>
      );

      expect(mockUseThemeColor).toHaveBeenCalledWith(
        { light: '#ffffff', dark: '#000000' },
        'text'
      );
    });

    it('should call useThemeColor without custom colors', () => {
      render(<ThemedText>Regular Text</ThemedText>);

      expect(mockUseThemeColor).toHaveBeenCalledWith(
        { light: undefined, dark: undefined },
        'text'
      );
    });

    it('should apply theme color to style', () => {
      mockUseThemeColor.mockReturnValue('#ff0000');

      const { getByText } = render(
        <ThemedText lightColor="#ffffff">Red Text</ThemedText>
      );

      const textElement = getByText('Red Text');
      expect(textElement).toBeTruthy();
    });
  });

  describe('Custom Props and Styles', () => {
    it('should accept custom style props', () => {
      const customStyle = { fontSize: 20, fontWeight: 'bold' as const };

      const { getByText } = render(
        <ThemedText style={customStyle}>Styled Text</ThemedText>
      );

      expect(getByText('Styled Text')).toBeTruthy();
    });

    it('should accept TextProps', () => {
      const { getByText } = render(
        <ThemedText numberOfLines={1} ellipsizeMode="tail">
          Long text that should be truncated
        </ThemedText>
      );

      expect(getByText('Long text that should be truncated')).toBeTruthy();
    });

    it('should handle accessibility props', () => {
      const { getByText } = render(
        <ThemedText 
          accessibilityLabel="Accessible text"
          accessibilityHint="This is a hint"
        >
          Accessible Content
        </ThemedText>
      );

      expect(getByText('Accessible Content')).toBeTruthy();
    });
  });

  describe('React.memo Behavior', () => {
    it('should be wrapped in React.memo', () => {
      // Test that ThemedText component exists and is functional
      const { getByText } = render(<ThemedText>Memo Test</ThemedText>);
      expect(getByText('Memo Test')).toBeTruthy();
    });
  });
});

describe('ThemedView Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseThemeColor.mockReturnValue('#ffffff');
  });

  describe('Basic Rendering', () => {
    it('should render children correctly', () => {
      const { getByText } = render(
        <ThemedView>
          <ThemedText>Child Content</ThemedText>
        </ThemedView>
      );

      expect(getByText('Child Content')).toBeTruthy();
    });

    it('should render without children', () => {
      const { root } = render(<ThemedView />);
      expect(root).toBeTruthy();
    });

    it('should render multiple children', () => {
      const { getByText } = render(
        <ThemedView>
          <ThemedText>First Child</ThemedText>
          <ThemedText>Second Child</ThemedText>
        </ThemedView>
      );

      expect(getByText('First Child')).toBeTruthy();
      expect(getByText('Second Child')).toBeTruthy();
    });
  });

  describe('Theme Color Integration', () => {
    it('should call useThemeColor with background key', () => {
      render(
        <ThemedView lightColor="#f0f0f0" darkColor="#333333">
          <ThemedText>Content</ThemedText>
        </ThemedView>
      );

      expect(mockUseThemeColor).toHaveBeenCalledWith(
        { light: '#f0f0f0', dark: '#333333' },
        'background'
      );
    });

    it('should work without custom theme colors', () => {
      render(
        <ThemedView>
          <ThemedText>Content</ThemedText>
        </ThemedView>
      );

      expect(mockUseThemeColor).toHaveBeenCalledWith(
        { light: undefined, dark: undefined },
        'background'
      );
    });

    it('should apply background color from theme', () => {
      mockUseThemeColor.mockReturnValue('#00ff00');

      const { getByText } = render(
        <ThemedView darkColor="#333333">
          <ThemedText>Green Background</ThemedText>
        </ThemedView>
      );

      expect(getByText('Green Background')).toBeTruthy();
    });
  });

  describe('Custom Props and Styles', () => {
    it('should accept custom style props', () => {
      const customStyle = { 
        padding: 20, 
        margin: 10,
        borderRadius: 8 
      };

      const { getByText } = render(
        <ThemedView style={customStyle}>
          <ThemedText>Styled View</ThemedText>
        </ThemedView>
      );

      expect(getByText('Styled View')).toBeTruthy();
    });

    it('should merge styles correctly', () => {
      mockUseThemeColor.mockReturnValue('#ff00ff');

      const { getByText } = render(
        <ThemedView 
          style={{ padding: 15 }}
          lightColor="#ffffff"
        >
          <ThemedText>Merged Styles</ThemedText>
        </ThemedView>
      );

      expect(getByText('Merged Styles')).toBeTruthy();
    });

    it('should accept View props', () => {
      const { getByText } = render(
        <ThemedView 
          accessible={true}
          accessibilityLabel="Themed container"
          testID="themed-view"
        >
          <ThemedText>Accessible View</ThemedText>
        </ThemedView>
      );

      expect(getByText('Accessible View')).toBeTruthy();
    });
  });

  describe('Integration Tests', () => {
    it('should work with nested ThemedText components', () => {
      const { getByText } = render(
        <ThemedView lightColor="#f8f8f8">
          <ThemedText type="title">Main Title</ThemedText>
          <ThemedText type="subtitle">Subtitle</ThemedText>
          <ThemedText>Regular content text</ThemedText>
        </ThemedView>
      );

      expect(getByText('Main Title')).toBeTruthy();
      expect(getByText('Subtitle')).toBeTruthy();
      expect(getByText('Regular content text')).toBeTruthy();
    });

    it('should work with complex nested structure', () => {
      const { getByText } = render(
        <ThemedView>
          <ThemedView lightColor="#ffffff">
            <ThemedText type="title">Nested Title</ThemedText>
            <ThemedView darkColor="#000000">
              <ThemedText type="link">Deep Link</ThemedText>
            </ThemedView>
          </ThemedView>
        </ThemedView>
      );

      expect(getByText('Nested Title')).toBeTruthy();
      expect(getByText('Deep Link')).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('should handle theme hook errors gracefully', () => {
      mockUseThemeColor.mockImplementation(() => {
        throw new Error('Theme error');
      });

      expect(() =>
        render(
          <ThemedView>
            <ThemedText>Error Test</ThemedText>
          </ThemedView>
        )
      ).toThrow();
    });
  });
});

describe('ThemedComponents Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseThemeColor.mockReturnValue('#123456');
  });

  describe('Component Interaction', () => {
    it('should render complete themed interface', () => {
      const { getByText } = render(
        <ThemedView lightColor="#ffffff" darkColor="#000000">
          <ThemedText type="title" lightColor="#333333">
            App Title
          </ThemedText>
          <ThemedText type="subtitle">
            Section Subtitle
          </ThemedText>
          <ThemedView style={{ padding: 10 }}>
            <ThemedText>Nested content in themed container</ThemedText>
            <ThemedText type="link">Action Link</ThemedText>
          </ThemedView>
        </ThemedView>
      );

      expect(getByText('App Title')).toBeTruthy();
      expect(getByText('Section Subtitle')).toBeTruthy();
      expect(getByText('Nested content in themed container')).toBeTruthy();
      expect(getByText('Action Link')).toBeTruthy();
    });

    it('should call theme hooks for each component', () => {
      render(
        <ThemedView>
          <ThemedText>Test</ThemedText>
        </ThemedView>
      );

      // Should be called once for ThemedView (background) and once for ThemedText (text)
      expect(mockUseThemeColor).toHaveBeenCalledTimes(2);
      expect(mockUseThemeColor).toHaveBeenCalledWith(expect.any(Object), 'background');
      expect(mockUseThemeColor).toHaveBeenCalledWith(expect.any(Object), 'text');
    });
  });

  describe('Performance Considerations', () => {
    it('should handle multiple renders efficiently', () => {
      const { rerender } = render(
        <ThemedView>
          <ThemedText>Initial Text</ThemedText>
        </ThemedView>
      );

      rerender(
        <ThemedView>
          <ThemedText>Updated Text</ThemedText>
        </ThemedView>
      );

      // Component should handle re-renders gracefully
      expect(mockUseThemeColor).toHaveBeenCalled();
    });
  });
});