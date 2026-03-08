"use client";

import { PersonIcon, PlusCircledIcon } from "@radix-ui/react-icons";
import { useCallback, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuItem,
} from "@/lib/components/ui/DropdownMenu";
import type { AdminUser } from "./actions";
import { impersonateUserAction } from "./actions";
import { GrantCreditsModal } from "./GrantCreditsModal";

interface UserTableProps {
  users: AdminUser[];
}

export function UserTable({ users }: UserTableProps) {
  const [grantModalUser, setGrantModalUser] = useState<AdminUser | null>(null);

  const handleGrantCredits = useCallback((user: AdminUser) => {
    setGrantModalUser(user);
  }, []);

  const handleImpersonate = useCallback(async (user: AdminUser) => {
    if (
      !window.confirm(
        `Log in as ${user.email}? You will be signed out of your admin account.`,
      )
    ) {
      return;
    }
    const result = await impersonateUserAction(user.user_id);
    if (result.success) {
      window.location.href = "/dashboard";
    } else {
      alert(result.error ?? "Failed to impersonate user");
    }
  }, []);

  const handleCloseModal = useCallback(() => {
    setGrantModalUser(null);
  }, []);

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-black/10 bg-white/90 shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-black/10 text-left text-sm font-semibold text-black">
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3 text-right">Generations last 30 d</th>
              <th className="px-4 py-3 text-right">Credits</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3 w-12" />
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user.user_id}
                className="border-b border-black/5 text-sm text-black/80 hover:bg-black/2.5 transition-colors"
              >
                <td className="px-4 py-3 font-medium">{user.email}</td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {user.generation_count.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {user.credits !== null ? user.credits.toLocaleString() : "-"}
                </td>
                <td className="px-4 py-3 text-black/50">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <DropdownMenu>
                    <DropdownMenuItem onClick={() => handleGrantCredits(user)}>
                      <PlusCircledIcon className="size-4" />
                      Grant extra credits
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleImpersonate(user)}>
                      <PersonIcon className="size-4" />
                      Log in as this user
                    </DropdownMenuItem>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {grantModalUser && (
        <GrantCreditsModal
          open={!!grantModalUser}
          onOpenChange={(open) => !open && handleCloseModal()}
          userId={grantModalUser.user_id}
          userEmail={grantModalUser.email}
        />
      )}
    </>
  );
}
