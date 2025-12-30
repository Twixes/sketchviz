"use client";

import { ArrowLeftIcon } from "@radix-ui/react-icons";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { FunkyBackground } from "@/components/FunkyBackground";
import { Header } from "@/components/Header";
import { MarkdownContent } from "@/components/MarkdownContent";
import { useSession } from "@/components/SessionProvider";
import termsContent from "@/content/terms.md";
import { Button } from "@/lib/components/ui/Button";

const LAYOUT_TRANSITION = {
  type: "spring",
  stiffness: 160,
  damping: 22,
} as const;

const FADE_TRANSITION = { duration: 0.35, ease: "easeOut" } as const;

export default function TermsPage() {
  const { user } = useSession();
  const router = useRouter();

  return (
    <FunkyBackground>
      <motion.main
        transition={LAYOUT_TRANSITION}
        className="relative z-10 mx-auto flex w-full max-w-5xl flex-col gap-12 px-6 pb-24 pt-10 lg:px-10"
      >
        <Header user={user} />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={FADE_TRANSITION}
          className="space-y-8"
        >
          <div className="rounded-3xl border-2 border-black/10 bg-white/80 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.06)] backdrop-blur-sm lg:p-12">
            <MarkdownContent content={termsContent} />
          </div>
        </motion.div>
      </motion.main>
    </FunkyBackground>
  );
}
