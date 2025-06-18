// Custom hook untuk pengecekan permission berbasis context
// Ikuti pola atomic & context pada copilot-instruction.md
import { AuthContext } from '@/context/auth-context';
import { useContext } from 'react';

/**
 * Hook untuk cek apakah user punya permission tertentu
 * @param permission string permission, contoh: 'create_user'
 * @returns boolean
 */
export function usePermission(permission: string): boolean {
  const { permissions } = useContext(AuthContext);
  return Array.isArray(permissions) && permissions.includes(permission);
}
