"use client"

import { Badge } from "@/components/ui/badge"
import { GroupRole, RoleDescriptions } from "@/types/roles"

interface RoleBadgeProps {
  role: GroupRole
  variant?: "default" | "secondary" | "outline"
}

/**
 * Component to display role as a visual badge
 */
export function RoleBadge({ role, variant = "default" }: RoleBadgeProps) {
  const getVariant = (role: GroupRole) => {
    switch (role) {
      case GroupRole.ADMIN:
        return "default"
      case GroupRole.TREASURER:
        return "secondary"
      case GroupRole.MEMBER:
        return "outline"
      default:
        return "outline"
    }
  }

  return (
    <Badge variant={getVariant(role)} title={RoleDescriptions[role]}>
      {role}
    </Badge>
  )
}

interface RoleSelectProps {
  value: GroupRole
  onChange: (role: GroupRole) => void
  disabled?: boolean
}

/**
 * Component for admin to select a role
 */
export function RoleSelect({ value, onChange, disabled = false }: RoleSelectProps) {
  const roles = [GroupRole.ADMIN, GroupRole.TREASURER, GroupRole.MEMBER]

  return (
    <div className="flex gap-2">
      {roles.map((role) => (
        <button
          key={role}
          onClick={() => onChange(role)}
          disabled={disabled}
          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
            value === role
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {role}
        </button>
      ))}
    </div>
  )
}
