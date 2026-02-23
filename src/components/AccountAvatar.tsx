"use client";

import { ExitIcon, PersonIcon, ReaderIcon } from "@radix-ui/react-icons";
import { useState } from "react";
import { useSignOutCallback } from "@/hooks/use-sign-out-callback";
import {
  DropdownMenu,
  DropdownMenuItem,
} from "@/lib/components/ui/DropdownMenu";
import type { SessionUser } from "./SessionProvider";

interface AccountAvatarProps {
  user: SessionUser;
}

function getInitial(user: SessionUser): string {
  const name = user.user_metadata.full_name;
  if (name) return name.charAt(0).toUpperCase();
  return user.email.charAt(0).toUpperCase();
}

export function AccountAvatar({ user }: AccountAvatarProps) {
  const handleSignOut = useSignOutCallback();
  const avatarUrl = user.user_metadata.avatar_url;
  const [imgError, setImgError] = useState(false);

  const trigger = (
    <button
      type="button"
      className="flex size-8.5 shrink-0 cursor-pointer items-center justify-center rounded-full border border-black/20 hover:border-black/40 bg-black/10 overflow-hidden focus:outline-none focus:ring-2 focus:ring-black/20 select-none"
      aria-label="Account menu"
    >
      {avatarUrl && !imgError ? (
        <img
          src={avatarUrl}
          alt=""
          className="size-full object-cover"
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
        />
      ) : (
        <span className="text-sm font-medium text-black/60">
          {getInitial(user)}
        </span>
      )}
    </button>
  );

  return (
    <DropdownMenu trigger={trigger} dropdownAlign="end">
      <DropdownMenuItem link="/account">
        <PersonIcon className="size-4" />
        Account settings
      </DropdownMenuItem>
      <DropdownMenuItem link="/billing/portal">
        <ReaderIcon className="size-4" />
        Billing
      </DropdownMenuItem>
      <DropdownMenuItem onClick={handleSignOut} destructive>
        <ExitIcon className="size-4" />
        Log out
      </DropdownMenuItem>
    </DropdownMenu>
  );
}
