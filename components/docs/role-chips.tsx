import { User } from 'lucide-react'

interface RoleChipsProps {
  roles: string[]
}

export function RoleChips({ roles }: RoleChipsProps) {
  if (!roles || roles.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {roles.map((role) => (
        <span
          key={role}
          className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full bg-[var(--primary)] text-[var(--primary-foreground)]"
        >
          <User size={12} />
          {role}
        </span>
      ))}
    </div>
  )
}
