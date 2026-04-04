"use client";

import { Cross2Icon } from "@radix-ui/react-icons";
import { Button } from "@/lib/components/ui/Button";

export interface TeamMemberData {
  userId: string;
  email: string;
  fullName: string | null;
  role: "owner" | "member";
}

interface TeamMemberListProps {
  members: TeamMemberData[];
  isOwner: boolean;
  currentUserId: string;
  onRemoveMember?: (userId: string) => void;
  isRemoving?: boolean;
}

export function TeamMemberList({
  members,
  isOwner,
  currentUserId,
  onRemoveMember,
  isRemoving,
}: TeamMemberListProps) {
  return (
    <div className="divide-y divide-black/10 rounded-lg border border-black/10">
      {members.map((member) => (
        <div
          key={member.userId}
          className="flex items-center justify-between px-4 py-3"
        >
          <div className="flex flex-col">
            <span className="text-sm font-medium text-black">
              {member.fullName ?? member.email}
              {member.userId === currentUserId && (
                <span className="ml-1.5 text-xs text-black/50">(you)</span>
              )}
            </span>
            {member.fullName && (
              <span className="text-xs text-black/50">{member.email}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-black/50 capitalize">
              {member.role}
            </span>
            {isOwner &&
              member.userId !== currentUserId &&
              member.role !== "owner" && (
                <Button
                  variant="icon"
                  size="sm"
                  colorScheme="light"
                  tooltip="Remove member"
                  disabled={isRemoving}
                  onClick={() => onRemoveMember?.(member.userId)}
                >
                  <Cross2Icon className="size-3.5" />
                </Button>
              )}
          </div>
        </div>
      ))}
      {members.length === 0 && (
        <div className="px-4 py-6 text-center text-sm text-black/50">
          No members yet
        </div>
      )}
    </div>
  );
}
