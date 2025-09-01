import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from '@/types/common';
import { log } from '@/utils/logger';

/**
 * Simple hook for managing authentication data (user, token, permissions)
 * Follows single responsibility principle - only handles data persistence
 */
export function useAuthData() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Load authentication data from storage on mount
  useEffect(() => {
    loadAuthData();
  }, []);

  const loadAuthData = async () => {
    setLoading(true);
    try {
      const [storedToken, storedUser, storedPermissions] = await Promise.all([
        AsyncStorage.getItem('token'),
        AsyncStorage.getItem('user'),
        AsyncStorage.getItem('permissions')
      ]);

      if (storedToken && storedUser) {
        setToken(storedToken);
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);

        // Load permissions with fallback hierarchy
        if (storedPermissions) {
          setPermissions(JSON.parse(storedPermissions));
        } else if (parsedUser?.role?.permissions && Array.isArray(parsedUser.role.permissions)) {
          const perms = parsedUser.role.permissions.map((p: any) => p.name);
          setPermissions(perms);
        } else if (parsedUser && Array.isArray(parsedUser.permissions)) {
          setPermissions(parsedUser.permissions);
        } else {
          setPermissions([]);
        }
      }
    } catch (error) {
      log('[AUTH_DATA] Failed to load auth data:', error);
      // Clear potentially corrupted data
      await clearAuthData();
    } finally {
      setLoading(false);
    }
  };

  const saveAuthData = async (
    newToken: string, 
    newUser: User, 
    newPermissions: string[]
  ) => {
    try {
      await Promise.all([
        AsyncStorage.setItem('token', newToken),
        AsyncStorage.setItem('user', JSON.stringify(newUser)),
        AsyncStorage.setItem('permissions', JSON.stringify(newPermissions))
      ]);

      setToken(newToken);
      setUser(newUser);
      setPermissions(newPermissions);

      log('[AUTH_DATA] Auth data saved successfully');
    } catch (error) {
      log('[AUTH_DATA] Failed to save auth data:', error);
      throw new Error('Failed to save authentication data');
    }
  };

  const clearAuthData = async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem('token'),
        AsyncStorage.removeItem('user'),
        AsyncStorage.removeItem('permissions')
      ]);

      setToken(null);
      setUser(null);
      setPermissions([]);

      log('[AUTH_DATA] Auth data cleared successfully');
    } catch (error) {
      log('[AUTH_DATA] Failed to clear auth data:', error);
      // Force clear state even if storage fails
      setToken(null);
      setUser(null);
      setPermissions([]);
    }
  };

  const updateUser = async (updatedUser: User) => {
    try {
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);

      // Update permissions if they changed
      const userPermissions = updatedUser?.role?.permissions?.map((p: any) => p.name) || [];
      if (JSON.stringify(userPermissions) !== JSON.stringify(permissions)) {
        setPermissions(userPermissions);
        await AsyncStorage.setItem('permissions', JSON.stringify(userPermissions));
      }

      log('[AUTH_DATA] User data updated successfully');
    } catch (error) {
      log('[AUTH_DATA] Failed to update user data:', error);
      throw new Error('Failed to update user data');
    }
  };

  return {
    // State
    user,
    token,
    permissions,
    loading,
    
    // Actions
    saveAuthData,
    clearAuthData,
    updateUser,
    refresh: loadAuthData,
  };
}