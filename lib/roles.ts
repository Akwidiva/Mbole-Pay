/**
 * System-level role hierarchy levels
 * Based on use case diagram:
 * - ADMIN: Manage users, groups, disputes, full system access
 * - USER/MEMBER: Contribute, Vote in Disputes, Receive Payouts
 */
export const ROLE_HIERARCHY = {
  ADMIN: 2,
  USER: 1,
};

/**
 * Group-level role hierarchy
 * - ADMIN: Manage group, assign roles, manage members
 * - MEMBER: Contribute, vote, receive payouts
 * - MEMBER: Contribute, vote, receive payouts
 */
export const GROUP_ROLE_HIERARCHY = {
  ADMIN: 2,
  MEMBER: 1,
};

/**
 * Role capabilities mapping based on use case diagram
 */
export const ROLE_CAPABILITIES = {
  ADMIN: {
    system: ['manage_users', 'approve_members', 'reject_members', 'resolve_disputes', 'manage_all_groups', 'view_all_reports'],
    group: ['manage_group', 'view_reports', 'manage_members', 'record_payments'],
  },
  USER: {
    system: ['create_group', 'join_group'],
    group: ['contribute', 'vote_disputes', 'receive_payout', 'view_group_reports'],
  },
};

/**
 * Check if a user has at least a certain role
 */
export function hasRole(userRole, requiredRole) {
  const userLevel = ROLE_HIERARCHY[userRole] || 0;
  const requiredLevel = ROLE_HIERARCHY[requiredRole] || 0;
  return userLevel >= requiredLevel;
}

/**
 * Check if a user has at least a certain group role
 */
export function hasGroupRole(memberRole, requiredRole) {
  const userLevel = GROUP_ROLE_HIERARCHY[memberRole] || 0;
  const requiredLevel = GROUP_ROLE_HIERARCHY[requiredRole] || 0;
  return userLevel >= requiredLevel;
}

/**
 * Get human-readable role name
 */
export function getRoleName(role) {
  const roleNames = {
    ADMIN: 'Administrator',
    USER: 'Member',
  };
  return roleNames[role] || 'Unknown';
}

/**
 * Get human-readable group role name
 */
export function getGroupRoleName(role) {
  const roleNames = {
    ADMIN: 'Group Admin',
    MEMBER: 'Member',
  };
  return roleNames[role] || 'Unknown';
}

/**
 * Check if user can perform a capability
 * @param {string} userRole - User's system role
 * @param {string} capability - Capability to check
 * @param {string} context - 'system' or 'group'
 */
export function canPerformCapability(userRole, capability, context = 'system') {
  const capabilities = ROLE_CAPABILITIES[userRole]?.[context] || [];
  return capabilities.includes(capability);
}
