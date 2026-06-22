/**
 * Role-Based Access Control (RBAC) Types
 */

/**
 * User roles within a group
 */
export enum GroupRole {
  ADMIN = "ADMIN",
  MEMBER = "MEMBER",
}

/**
 * Permission definitions
 */
export type Permission =
  | "group:view"
  | "group:edit"
  | "group:delete"
  | "members:view"
  | "members:add"
  | "members:remove"
  | "contributions:view"
  | "contributions:edit"
  | "contributions:create"
  | "contributions:delete"
  | "payments:view"
  | "payments:create"
  | "payments:approve"
  | "payments:retry"
  | "payouts:view"
  | "payouts:create"
  | "payouts:approve"
  | "reports:generate"
  | "reports:view"
  | "reports:export"
  | "disputes:view"
  | "disputes:create"
  | "disputes:resolve";

/**
 * Role-to-permissions mapping
 */
export const RolePermissions: Record<GroupRole, Permission[]> = {
  [GroupRole.ADMIN]: [
    "group:view",
    "group:edit",
    "group:delete",
    "members:view",
    "members:add",
    "members:remove",
    "contributions:view",
    "contributions:edit",
    "contributions:create",
    "contributions:delete",
    "payments:view",
    "payments:create",
    "payments:approve",
    "payments:retry",
    "payouts:view",
    "payouts:create",
    "payouts:approve",
    "reports:generate",
    "reports:view",
    "reports:export",
    "disputes:view",
    "disputes:create",
    "disputes:resolve",
  ],
  [GroupRole.MEMBER]: [
    "group:view",
    "contributions:view",
    "payments:view",
    "payments:create",
    "reports:view",
    "disputes:view",
    "disputes:create",
  ],
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: GroupRole, permission: Permission): boolean {
  return RolePermissions[role].includes(permission);
}

/**
 * Check if any of the roles have a specific permission
 */
export function hasAnyPermission(
  roles: GroupRole[],
  permission: Permission
): boolean {
  return roles.some((role) => hasPermission(role, permission));
}

/**
 * Check if all of the roles have a specific permission
 */
export function hasAllPermissions(
  roles: GroupRole[],
  permission: Permission
): boolean {
  return roles.every((role) => hasPermission(role, permission));
}

/**
 * Role descriptions for UI
 */
export const RoleDescriptions: Record<GroupRole, string> = {
  [GroupRole.ADMIN]: "Full access to manage group, members, and all operations",
  [GroupRole.MEMBER]: "View group info, make contributions, and request reports",
};

/**
 * Get role hierarchy (higher index = more permissions)
 */
export const RoleHierarchy: Record<GroupRole, number> = {
  [GroupRole.MEMBER]: 1,
  [GroupRole.ADMIN]: 2,
};

/**
 * Check if one role outranks another
 */
export function roleOutranks(higher: GroupRole, lower: GroupRole): boolean {
  return RoleHierarchy[higher] > RoleHierarchy[lower];
}
