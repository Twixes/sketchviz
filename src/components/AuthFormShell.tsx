"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { Logo } from "@/components/Logo";
import { NeonBackground } from "@/components/NeonBackground";
import { FADE_TRANSITION } from "@/lib/animation-constants";

interface AuthFormShellProps {
  children: ReactNode;
}

export function AuthFormShell({ children }: AuthFormShellProps) {
  return (
    <NeonBackground>
      <div className="flex flex-1 flex-col items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={FADE_TRANSITION}
          className="w-full flex flex-col items-center mb-4"
        >
          <div className="mb-6 flex justify-center">
            <Logo />
          </div>
          <div className="w-sm max-w-full rounded-xl border border-black/10 bg-white p-8 shadow-xl">
            {children}
          </div>
        </motion.div>
      </div>
    </NeonBackground>
  );
}
