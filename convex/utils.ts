import { v } from "convex/values";

/**
 * Generate a random share token for session sharing
 */
export function generateShareToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate a unique player ID within a session
 */
export function generatePlayerId(): string {
  return crypto.randomUUID();
}

/**
 * Check if user has permission to perform action on session
 */
export function hasPermission(
  session: any,
  userId: string | null,
  requiredPermission: "view" | "edit" | "admin"
): boolean {
  if (!userId) return false;
  
  // Owner has all permissions
  if (session.ownerId === userId) return true;
  
  // Check explicit permissions
  const userPermission = session.permissions?.[userId];
  if (!userPermission) return false;
  
  switch (requiredPermission) {
    case "view":
      return ["viewer", "collaborator", "owner"].includes(userPermission);
    case "edit":
      return ["collaborator", "owner"].includes(userPermission);
    case "admin":
      return userPermission === "owner";
    default:
      return false;
  }
}

/**
 * Permission levels for session access
 */
export const PERMISSIONS = {
  OWNER: "owner",
  COLLABORATOR: "collaborator", 
  VIEWER: "viewer"
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];
