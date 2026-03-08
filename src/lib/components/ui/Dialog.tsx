"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Cross2Icon } from "@radix-ui/react-icons";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Button } from "./Button";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
}: DialogProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-in fade-in-0" />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2",
            "rounded-xl border border-black/10 bg-white p-6 shadow-xl",
            "animate-in fade-in-0 zoom-in-95 slide-in-from-left-1/2 slide-in-from-top-[48%]",
          )}
        >
          {/* Header */}
          <div className="pr-8">
            <DialogPrimitive.Title className="text-lg font-semibold text-black">
              {title}
            </DialogPrimitive.Title>
            {description && (
              <DialogPrimitive.Description className="mt-2 text-sm text-black/60">
                {description}
              </DialogPrimitive.Description>
            )}
          </div>

          {/* Close button */}
          <DialogPrimitive.Close asChild>
            <Button
              variant="icon"
              size="sm"
              colorScheme="light"
              aria-label="Close"
              className="absolute right-4 top-4"
            >
              <Cross2Icon className="size-4" />
            </Button>
          </DialogPrimitive.Close>

          {/* Content */}
          <div className="mt-4">{children}</div>

          {/* Footer */}
          {footer && (
            <div className="mt-6 flex justify-end gap-3">{footer}</div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
