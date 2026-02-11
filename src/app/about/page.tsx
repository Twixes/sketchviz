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
        <MarkdownContent content={aboutContent} />
      </motion.div>
    </PageWrapper>
  );
}
