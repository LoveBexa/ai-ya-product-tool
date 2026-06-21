import Image from "next/image"
import { cn } from "@/lib/utils"
import { displayAvatar } from "@/lib/auth/display-avatar"
import type { Profile } from "@/lib/types"

export function UserAvatar({
  profile,
  size = "md",
  className,
}: {
  profile: Pick<Profile, "avatar_url" | "emoji" | "avatar_source"> | null
  size?: "sm" | "md" | "lg"
  className?: string
}) {
  const dim =
    size === "sm" ? "h-8 w-8 text-base" : size === "lg" ? "h-14 w-14 text-2xl" : "h-9 w-9 text-lg"

  if (!profile) {
    return (
      <span
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full bg-secondary font-bold text-muted-foreground",
          dim,
          className,
        )}
      >
        ?
      </span>
    )
  }

  const avatar = displayAvatar(profile)

  if (avatar.type === "image") {
    return (
      <Image
        src={avatar.url}
        alt=""
        width={size === "lg" ? 56 : size === "sm" ? 32 : 36}
        height={size === "lg" ? 56 : size === "sm" ? 32 : 36}
        className={cn("shrink-0 rounded-full object-cover", dim, className)}
        unoptimized
      />
    )
  }

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-secondary leading-none",
        dim,
        className,
      )}
      aria-hidden
    >
      {avatar.emoji}
    </span>
  )
}
