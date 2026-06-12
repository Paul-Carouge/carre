import type { Profile } from "@/lib/types"

export function UserAvatar({
  user,
  size = "md",
}: {
  user: Profile
  size?: "sm" | "md" | "lg"
}) {
  const sizes = {
    sm: "w-6 h-6 text-[10px]",
    md: "w-10 h-10 text-sm",
    lg: "w-14 h-14 text-lg",
  }

  const initial = (user.display_name || user.username || "?")[0].toUpperCase()

  if (user.avatar_url) {
    return (
      <img
        src={user.avatar_url}
        alt={user.display_name || user.username}
        className={`${sizes[size]} rounded-full object-cover ring-1 ring-white/10`}
      />
    )
  }

  return (
    <div
      className={`${sizes[size]} rounded-full bg-or-subtle border border-or/20 flex items-center justify-center text-or font-medium shrink-0`}
    >
      {initial}
    </div>
  )
}
