"use client";

import { motion } from "motion/react";
import { MarkdownContent } from "@/components/MarkdownContent";
import { PageWrapper } from "@/components/PageWrapper";
import { useSession } from "@/components/SessionProvider";
import aboutContent from "@/content/about.md";
import { FADE_TRANSITION } from "@/lib/animation-constants";

export default function AboutPage() {
  const { user } = useSession();

  return (
    <PageWrapper user={user} maxWidth="narrow">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={FADE_TRANSITION}
        className="space-y-8"
      >
        <div className="rounded-3xl border-2 border-black/10 bg-white/80 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.06)] backdrop-blur-sm lg:p-12">
          <MarkdownContent content={aboutContent} />
        </div>
      </motion.div>
    </PageWrapper>
  );
}
