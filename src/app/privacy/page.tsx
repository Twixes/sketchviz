"use client";

import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { FunkyBackgroundFuzz } from "@/components/FunkyBackgroundFuzz";
import { Header } from "@/components/Header";
import { MarkdownContent } from "@/components/MarkdownContent";
import { useSession } from "@/components/SessionProvider";
import privacyContent from "@/content/privacy.md";
import { FADE_TRANSITION, LAYOUT_TRANSITION } from "@/lib/animation-constants";

export default function PrivacyPage() {
  const { user } = useSession();

  return (
    <FunkyBackgroundFuzz>
      <motion.main
        transition={LAYOUT_TRANSITION}
        className="relative z-10 mx-auto flex grow w-full max-w-5xl flex-col gap-12 px-6 pb-24 pt-10 lg:px-10"
      >
        <Header user={user} />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={FADE_TRANSITION}
          className="space-y-8"
        >
          <div className="rounded-3xl border-2 border-black/10 bg-white/80 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.06)] backdrop-blur-sm lg:p-12">
            <MarkdownContent content={privacyContent} />
          </div>
        </motion.div>
      </motion.main>
    </FunkyBackgroundFuzz>
  );
}
