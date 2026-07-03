import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/db';

/**
 * Middleware to check if user has a specific system role
 */
export async function checkUserRole(requiredRole) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return {
      authorized: false,
      user: null,
      error: 'Unauthorized',
    };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true, email: true, name: true },
    });

    if (!user) {
      return {
        authorized: false,
        user: null,
        error: 'User not found',
      };
    }

    // Check role hierarchy
    const roleHierarchy = {
      SUPER_ADMIN: 3,
      ADMIN: 2,
      USER: 1,
    };

    const userRoleLevel = roleHierarchy[user.role] || 0;
    const requiredRoleLevel = roleHierarchy[requiredRole] || 0;

    if (userRoleLevel < requiredRoleLevel) {
      return {
        authorized: false,
        user,
        error: 'Insufficient permissions',
      };
    }

    return {
      authorized: true,
      user,
      error: null,
    };
  } catch (error) {
    console.error('Error checking user role:', error);
    return {
      authorized: false,
      user: null,
      error: 'Internal Server Error',
    };
  }
}

/**
 * Middleware to check if user has a specific group role
 */
export async function checkGroupRole(groupId, requiredGroupRole) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return {
      authorized: false,
      user: null,
      error: 'Unauthorized',
    };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return {
        authorized: false,
        user: null,
        error: 'User not found',
      };
    }

    const membership = await prisma.membership.findUnique({
      where: {
        userId_groupId: {
          userId: user.id,
          groupId,
        },
      },
      select: { role: true },
    });

    if (!membership) {
      return {
        authorized: false,
        user,
        error: 'Not a member of this group',
      };
    }

    const roleHierarchy = {
      ADMIN: 2,
      MEMBER: 1,
    };

    const userRoleLevel = roleHierarchy[membership.role] || 0;
    const requiredRoleLevel = roleHierarchy[requiredGroupRole] || 0;

    if (userRoleLevel < requiredRoleLevel) {
      return {
        authorized: false,
        user,
        error: 'Insufficient permissions in this group',
      };
    }

    return {
      authorized: true,
      user,
      membership,
      error: null,
    };
  } catch (error) {
    console.error('Error checking group role:', error);
    return {
      authorized: false,
      user: null,
      error: 'Internal Server Error',
    };
  }
}

/**
 * Helper to create error response
 */
export function roleErrorResponse(message, status = 403) {
  return NextResponse.json({ error: message }, { status });
}
