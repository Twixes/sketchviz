"use client";

import { motion } from "motion/react";
import { MarkdownContent } from "@/components/MarkdownContent";
import { PageWrapper } from "@/components/PageWrapper";
import { useSession } from "@/components/SessionProvider";
import pressContent from "@/content/press.md";
import { FADE_TRANSITION } from "@/lib/animation-constants";

export default function PressPage() {
  const { user } = useSession();

  return (
    <PageWrapper user={user} maxWidth="narrow">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={FADE_TRANSITION}
        className="space-y-8"
      >
        <MarkdownContent content={pressContent} />
      </motion.div>
    </PageWrapper>
  );
}
