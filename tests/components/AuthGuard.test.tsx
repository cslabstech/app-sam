/**
 * AuthGuard Component Tests
 * React Native component tests for authentication route protection
 * 
 * Tests cover:
 * - Authentication state handling
 * - Route protection logic
 * - Loading state management
 * - Navigation behavior
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { AuthGuard } from '@/components/AuthGuard';
import { ThemedText } from '@/components/ThemedText';

// Mock dependencies
jest.mock('@/context/auth-context');
jest.mock('@/utils/logger');

const mockUseAuth = require('@/context/auth-context').useAuth;
const mockLogger = require('@/utils/logger');

// Import the mocked expo-router after Jest setup
const mockRouter = require('expo-router');

describe('AuthGuard Component', () => {
  const mockReplace = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    mockUseAuth.mockReturnValue({
      token: null,
      loading: false,
    });
    
    // Override the replace function in the router mock
    mockRouter.useRouter = jest.fn().mockReturnValue({
      replace: mockReplace,
      push: jest.fn(),
      back: jest.fn(),
      canGoBack: jest.fn(),
    });
    
    mockLogger.log = jest.fn();
  });

  describe('Authenticated Access', () => {
    it('should render children when user is authenticated', () => {
      mockUseAuth.mockReturnValue({
        token: 'valid_jwt_token',
        loading: false,
      });

      const { getByText } = render(
        <AuthGuard>
          <ThemedText>Protected Content</ThemedText>
        </AuthGuard>
      );

      expect(getByText('Protected Content')).toBeTruthy();
      expect(mockReplace).not.toHaveBeenCalled();
    });

    it('should not redirect when token exists', () => {
      mockUseAuth.mockReturnValue({
        token: 'jwt_token_123',
        loading: false,
      });

      render(
        <AuthGuard>
          <ThemedText>Authenticated Content</ThemedText>
        </AuthGuard>
      );

      expect(mockReplace).not.toHaveBeenCalled();
      expect(mockLogger.log).not.toHaveBeenCalled();
    });

    it('should render complex protected content', () => {
      mockUseAuth.mockReturnValue({
        token: 'authenticated_token',
        loading: false,
      });

      const { getByText } = render(
        <AuthGuard>
          <ThemedText>Dashboard</ThemedText>
          <ThemedText>User Profile</ThemedText>
          <ThemedText>Settings</ThemedText>
        </AuthGuard>
      );

      expect(getByText('Dashboard')).toBeTruthy();
      expect(getByText('User Profile')).toBeTruthy();
      expect(getByText('Settings')).toBeTruthy();
    });
  });

  describe('Unauthenticated Access', () => {
    it('should redirect to login when no token', () => {
      mockUseAuth.mockReturnValue({
        token: null,
        loading: false,
      });

      render(
        <AuthGuard>
          <ThemedText>Protected Content</ThemedText>
        </AuthGuard>
      );

      expect(mockReplace).toHaveBeenCalledWith('/login');
      expect(mockLogger.log).toHaveBeenCalledWith(
        '[AUTH_GUARD] No token found, redirecting to login'
      );
    });

    it('should still render children during redirect', () => {
      mockUseAuth.mockReturnValue({
        token: null,
        loading: false,
      });

      const { getByText } = render(
        <AuthGuard>
          <ThemedText>Content During Redirect</ThemedText>
        </AuthGuard>
      );

      // Children should still render (AuthGuard returns children)
      expect(getByText('Content During Redirect')).toBeTruthy();
      expect(mockReplace).toHaveBeenCalledWith('/login');
    });

    it('should handle empty token string', () => {
      mockUseAuth.mockReturnValue({
        token: '',
        loading: false,
      });

      render(
        <AuthGuard>
          <ThemedText>Test Content</ThemedText>
        </AuthGuard>
      );

      expect(mockReplace).toHaveBeenCalledWith('/login');
    });

    it('should handle undefined token', () => {
      mockUseAuth.mockReturnValue({
        token: undefined,
        loading: false,
      });

      render(
        <AuthGuard>
          <ThemedText>Test Content</ThemedText>
        </AuthGuard>
      );

      expect(mockReplace).toHaveBeenCalledWith('/login');
    });
  });

  describe('Loading State Handling', () => {
    it('should not redirect while loading', () => {
      mockUseAuth.mockReturnValue({
        token: null,
        loading: true,
      });

      const { getByText } = render(
        <AuthGuard>
          <ThemedText>Loading Content</ThemedText>
        </AuthGuard>
      );

      expect(getByText('Loading Content')).toBeTruthy();
      expect(mockReplace).not.toHaveBeenCalled();
      expect(mockLogger.log).not.toHaveBeenCalled();
    });

    it('should redirect after loading completes without token', () => {
      // Start with loading state
      mockUseAuth.mockReturnValue({
        token: null,
        loading: true,
      });

      const { rerender } = render(
        <AuthGuard>
          <ThemedText>Content</ThemedText>
        </AuthGuard>
      );

      // Should not redirect while loading
      expect(mockReplace).not.toHaveBeenCalled();

      // Loading complete, no token - now should redirect
      mockReplace.mockClear(); // Clear any previous calls
      mockUseAuth.mockReturnValue({
        token: null,
        loading: false,
      });

      rerender(
        <AuthGuard>
          <ThemedText>Content</ThemedText>
        </AuthGuard>
      );

      expect(mockReplace).toHaveBeenCalledWith('/login');
    });

    it('should handle loading with valid token', () => {
      mockUseAuth.mockReturnValue({
        token: 'valid_token',
        loading: true,
      });

      const { getByText } = render(
        <AuthGuard>
          <ThemedText>Authenticated Loading</ThemedText>
        </AuthGuard>
      );

      expect(getByText('Authenticated Loading')).toBeTruthy();
      expect(mockReplace).not.toHaveBeenCalled();
    });
  });

  describe('Authentication State Changes', () => {
    it('should handle token appearing after initial render', () => {
      // Start with no token
      mockUseAuth.mockReturnValue({
        token: null,
        loading: false,
      });

      const { rerender } = render(
        <AuthGuard>
          <ThemedText>Dynamic Content</ThemedText>
        </AuthGuard>
      );

      expect(mockReplace).toHaveBeenCalledWith('/login');
      
      // Token appears (user logs in)
      mockUseAuth.mockReturnValue({
        token: 'new_token',
        loading: false,
      });

      rerender(
        <AuthGuard>
          <ThemedText>Dynamic Content</ThemedText>
        </AuthGuard>
      );

      // Should reset redirect behavior for future use
      expect(mockReplace).toHaveBeenCalledTimes(1); // Only the initial call
    });

    it('should handle token disappearing after being present', () => {
      // Start with valid token
      mockUseAuth.mockReturnValue({
        token: 'valid_token',
        loading: false,
      });

      const { rerender } = render(
        <AuthGuard>
          <ThemedText>Initially Protected</ThemedText>
        </AuthGuard>
      );

      expect(mockReplace).not.toHaveBeenCalled();

      // Token disappears (logout or expiration)
      mockUseAuth.mockReturnValue({
        token: null,
        loading: false,
      });

      rerender(
        <AuthGuard>
          <ThemedText>Now Unprotected</ThemedText>
        </AuthGuard>
      );

      expect(mockReplace).toHaveBeenCalledWith('/login');
    });

    it('should not redirect multiple times for same state', () => {
      mockUseAuth.mockReturnValue({
        token: null,
        loading: false,
      });

      const { rerender } = render(
        <AuthGuard>
          <ThemedText>Test Content</ThemedText>
        </AuthGuard>
      );

      expect(mockReplace).toHaveBeenCalledTimes(1);

      // Re-render with same state
      rerender(
        <AuthGuard>
          <ThemedText>Test Content</ThemedText>
        </AuthGuard>
      );

      // Should still only have been called once
      expect(mockReplace).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle auth context errors gracefully', () => {
      mockUseAuth.mockImplementation(() => {
        throw new Error('Auth context error');
      });

      expect(() =>
        render(
          <AuthGuard>
            <ThemedText>Error Content</ThemedText>
          </AuthGuard>
        )
      ).toThrow('Auth context error');
    });

    it('should handle router errors gracefully', () => {
      mockRouter.useRouter.mockImplementation(() => {
        throw new Error('Router error');
      });

      expect(() =>
        render(
          <AuthGuard>
            <ThemedText>Router Error Content</ThemedText>
          </AuthGuard>
        )
      ).toThrow('Router error');
    });

    it('should handle missing router replace method', () => {
      mockRouter.useRouter.mockReturnValue({
        push: jest.fn(),
        back: jest.fn(),
        // missing replace method
      });

      expect(() =>
        render(
          <AuthGuard>
            <ThemedText>Missing Replace</ThemedText>
          </AuthGuard>
        )
      ).toThrow();
    });

    it('should handle various falsy token values', () => {
      const falsyValues = [null, undefined, '', 0, false];

      falsyValues.forEach((falsyValue) => {
        mockReplace.mockClear();
        
        mockUseAuth.mockReturnValue({
          token: falsyValue,
          loading: false,
        });

        render(
          <AuthGuard>
            <ThemedText>Falsy Test</ThemedText>
          </AuthGuard>
        );

        expect(mockReplace).toHaveBeenCalledWith('/login');
      });
    });
  });

  describe('Component Integration', () => {
    it('should work with nested components', () => {
      mockUseAuth.mockReturnValue({
        token: 'authenticated',
        loading: false,
      });

      const { getByText } = render(
        <AuthGuard>
          <AuthGuard>
            <ThemedText>Nested Protection</ThemedText>
          </AuthGuard>
        </AuthGuard>
      );

      expect(getByText('Nested Protection')).toBeTruthy();
      expect(mockReplace).not.toHaveBeenCalled();
    });

    it('should work with complex component trees', () => {
      mockUseAuth.mockReturnValue({
        token: 'valid',
        loading: false,
      });

      const { getByText } = render(
        <AuthGuard>
          <ThemedText>Header</ThemedText>
          <AuthGuard>
            <ThemedText>Nested Content</ThemedText>
          </AuthGuard>
          <ThemedText>Footer</ThemedText>
        </AuthGuard>
      );

      expect(getByText('Header')).toBeTruthy();
      expect(getByText('Nested Content')).toBeTruthy();
      expect(getByText('Footer')).toBeTruthy();
    });
  });

  describe('Performance Considerations', () => {
    it('should not cause infinite re-renders', () => {
      mockUseAuth.mockReturnValue({
        token: 'stable_token',
        loading: false,
      });

      const { rerender } = render(
        <AuthGuard>
          <ThemedText>Stable Content</ThemedText>
        </AuthGuard>
      );

      // Multiple re-renders with same props
      for (let i = 0; i < 5; i++) {
        rerender(
          <AuthGuard>
            <ThemedText>Stable Content</ThemedText>
          </AuthGuard>
        );
      }

      // Should only use auth hook values, no excessive calls
      expect(mockReplace).not.toHaveBeenCalled();
    });
  });
});