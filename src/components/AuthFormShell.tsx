"use client";

import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { NeonBackground } from "@/components/NeonBackground";
import { FADE_TRANSITION } from "@/lib/animation-constants";

interface AuthFormShellProps {
  children: ReactNode;
}

export function AuthFormShell({ children }: AuthFormShellProps) {
  return (
    <NeonBackground>
      <div className="flex flex-1 items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={FADE_TRANSITION}
          className="w-full max-w-sm rounded-2xl border border-black/10 bg-white p-8 shadow-xl"
        >
          <Link
            href="/"
            className="flex items-center justify-center gap-2 mb-6"
          >
            <Image
              src="/icon.png"
              alt="SketchViz"
              className="size-12"
              width={48}
              height={48}
            />
            <p className="text-lg font-semibold tracking-tight text-black">
              SketchViz
            </p>
          </Link>
          {children}
        </motion.div>
      </div>
    </NeonBackground>
  );
}
