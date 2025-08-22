import { v } from "convex/values";

/**
 * Generate a 6-digit passcode for session joining
 */
export function generatePasscode(): string {
  // Generate a 6-digit number (100000 to 999999)
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Validate passcode format (6 digits)
 */
export function isValidPasscode(passcode: string): boolean {
  return /^\d{6}$/.test(passcode);
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
  session: { ownerId?: string; permissions?: Record<string, string> },
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
