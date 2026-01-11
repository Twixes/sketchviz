"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { PageWrapper } from "@/components/PageWrapper";
import { useSession } from "@/components/SessionProvider";
import { LAYOUT_TRANSITION, SLOW_TRANSITION } from "@/lib/animation-constants";
import { Button } from "@/lib/components/ui/Button";

export default function NotFound() {
  const { user } = useSession();

  return (
    <PageWrapper user={user}>
      <motion.section
        transition={LAYOUT_TRANSITION}
        className="grow grid place-items-center gap-8"
      >
        <div className="text-center space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={SLOW_TRANSITION}
            className="space-y-4"
          >
            <h1 className="text-9xl font-bold leading-none text-black/10">
              404
            </h1>
            <h2 className="text-4xl font-bold tracking-tight text-black">
              Page not found
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ ...SLOW_TRANSITION, delay: 0.15 }}
          >
            <Link href="/">
              <Button variant="primary" size="lg" className="cursor-pointer">
                Go back home
              </Button>
            </Link>
          </motion.div>
        </div>
      </motion.section>
    </PageWrapper>
  );
}
