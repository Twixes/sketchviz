"use client";

import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Button } from "./Button";

interface DropdownMenuProps {
  children: ReactNode;
  /** Custom trigger element, defaults to "..." icon button */
  trigger?: ReactNode;
  /** Variant of the button trigger. @default "ghost" */
  buttonVariant?: "primary" | "secondary" | "ghost";
  /** Alignment of the dropdown menu. @default "end" */
  dropdownAlign?: "start" | "end";
}

export function DropdownMenu({
  children,
  trigger,
  buttonVariant = "ghost",
  dropdownAlign = "end",
}: DropdownMenuProps) {
  return (
    <DropdownMenuPrimitive.Root>
      <DropdownMenuPrimitive.Trigger asChild>
        {trigger ?? (
          <Button variant={buttonVariant} size="sm" aria-label="Actions">
            <DotsHorizontalIcon className="size-4" />
          </Button>
        )}
      </DropdownMenuPrimitive.Trigger>
      <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.Content
          className={cn(
            "z-50 min-w-[180px] overflow-hidden rounded-xl border border-black/10 bg-white p-1 shadow-lg",
            "animate-in fade-in-0 zoom-in-95",
          )}
          sideOffset={4}
          align={dropdownAlign}
        >
          {children}
        </DropdownMenuPrimitive.Content>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Root>
  );
}

interface DropdownMenuItemProps {
  children: ReactNode;
  onClick?: () => void;
  /** When provided, renders the item as a Next.js Link for proper navigation behavior. */
  link?: string;
  destructive?: boolean;
  disabled?: boolean;
}

const itemClasses = (destructive?: boolean, disabled?: boolean) =>
  cn(
    "flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm outline-none transition-colors",
    disabled && "opacity-50 cursor-not-allowed",
    destructive
      ? "text-red-600 hover:bg-red-50 focus:bg-red-50"
      : "text-black hover:bg-black/5 focus:bg-black/5",
  );

export function DropdownMenuItem({
  children,
  onClick,
  link,
  destructive,
  disabled,
}: DropdownMenuItemProps) {
  if (link) {
    return (
      <DropdownMenuPrimitive.Item asChild disabled={disabled}>
        <Link href={link} className={itemClasses(destructive, disabled)}>
          {children}
        </Link>
      </DropdownMenuPrimitive.Item>
    );
  }

  return (
    <DropdownMenuPrimitive.Item
      className={itemClasses(destructive, disabled)}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
    >
      {children}
    </DropdownMenuPrimitive.Item>
  );
}
