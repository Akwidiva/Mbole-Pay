/**
 * RBAC Utilities
 * Functions for checking user roles and permissions
 */

import { prisma } from "@/lib/db";
import { GroupRole, hasPermission, type Permission } from "@/types/roles";

/**
 * Get user's role in a group
 */
export async function getUserGroupRole(
  userId: string,
  groupId: string
): Promise<GroupRole | null> {
  try {
    const membership = await prisma.membership.findUnique({
      where: {
        userId_groupId: {
          userId,
          groupId,
        },
      },
    });

    return membership ? (membership.role as GroupRole) : null;
  } catch (error) {
    console.error("Error getting user group role:", error);
    return null;
  }
}

/**
 * Check if user has permission in a group
 */
export async function userHasPermission(
  userId: string,
  groupId: string,
  permission: Permission
): Promise<boolean> {
  try {
    const role = await getUserGroupRole(userId, groupId);
    if (!role) return false;
    return hasPermission(role as GroupRole, permission);
  } catch (error) {
    console.error("Error checking user permission:", error);
    return false;
  }
}

/**
 * Check if user is group admin
 */
export async function isGroupAdmin(userId: string, groupId: string): Promise<boolean> {
  const role = await getUserGroupRole(userId, groupId);
  return role === GroupRole.ADMIN;
}

/**
 * Check if user is group treasurer or above
 */
export async function isGroupTreasurerOrAbove(
  userId: string,
  groupId: string
): Promise<boolean> {
  const role = await getUserGroupRole(userId, groupId);
  return role === GroupRole.ADMIN || role === GroupRole.TREASURER;
}

/**
 * Get all groups where user has a specific role
 */
export async function getUserGroupsByRole(userId: string, role: GroupRole) {
  try {
    const memberships = await prisma.membership.findMany({
      where: {
        userId,
        role,
      },
      include: {
        group: true,
      },
    });

    return memberships.map((m) => m.group);
  } catch (error) {
    console.error("Error getting user groups by role:", error);
    return [];
  }
}

/**
 * Get all groups where user has at least this role level
 */
export async function getUserGroupsByMinimumRole(
  userId: string,
  minimumRole: GroupRole
) {
  try {
    const memberships = await prisma.membership.findMany({
      where: {
        userId,
      },
      include: {
        group: true,
      },
    });

    const roleHierarchy: Record<GroupRole, number> = {
      MEMBER: 1,
      TREASURER: 2,
      ADMIN: 3,
    };

    return memberships
      .filter((m) => roleHierarchy[m.role as GroupRole] >= roleHierarchy[minimumRole])
      .map((m) => m.group);
  } catch (error) {
    console.error("Error getting user groups by minimum role:", error);
    return [];
  }
}

/**
 * Get user's role in all groups
 */
export async function getUserRolesInAllGroups(userId: string) {
  try {
    const memberships = await prisma.membership.findMany({
      where: {
        userId,
      },
      include: {
        group: true,
      },
    });

    return memberships.reduce(
      (acc, m) => {
        acc[m.groupId] = m.role as GroupRole;
        return acc;
      },
      {} as Record<string, GroupRole>
    );
  } catch (error) {
    console.error("Error getting user roles in all groups:", error);
    return {};
  }
}

/**
 * Validate user has access to group
 * Throws error if not found
 */
export async function requireGroupAccess(userId: string, groupId: string) {
  const role = await getUserGroupRole(userId, groupId);
  if (!role) {
    throw new Error(`User does not have access to group ${groupId}`);
  }
  return role;
}

/**
 * Validate user has specific permission in group
 * Throws error if permission denied
 */
export async function requirePermission(
  userId: string,
  groupId: string,
  permission: Permission
) {
  const hasAccess = await userHasPermission(userId, groupId, permission);
  if (!hasAccess) {
    throw new Error(
      `User does not have permission: ${permission} in group ${groupId}`
    );
  }
  return true;
}

/**
 * Validate user is group admin
 * Throws error if not admin
 */
export async function requireGroupAdmin(userId: string, groupId: string) {
  const isAdmin = await isGroupAdmin(userId, groupId);
  if (!isAdmin) {
    throw new Error(`User is not admin of group ${groupId}`);
  }
  return true;
}

/**
 * Validate user is group treasurer or above
 * Throws error if not treasurer+
 */
export async function requireGroupTreasurerOrAbove(userId: string, groupId: string) {
  const isTreasurerOrAbove = await isGroupTreasurerOrAbove(userId, groupId);
  if (!isTreasurerOrAbove) {
    throw new Error(`User is not treasurer+ of group ${groupId}`);
  }
  return true;
}
