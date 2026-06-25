import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Returns true for any system-level admin role (ADMIN or SUPER_ADMIN). */
export function isSystemAdmin(role?: string | null): boolean {
  return role === "ADMIN" || role === "SUPER_ADMIN"
}
