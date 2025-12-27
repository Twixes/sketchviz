"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { FunkyBackground } from "@/components/FunkyBackground";
import { Header } from "@/components/Header";
import { useSession } from "@/components/SessionProvider";
import { Button } from "@/lib/components/ui/Button";

const LAYOUT_TRANSITION = {
  type: "spring",
  stiffness: 160,
  damping: 22,
} as const;

export default function NotFound() {
  const { user } = useSession();

  return (
    <FunkyBackground>
      <motion.main
        layout
        transition={LAYOUT_TRANSITION}
        className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 pb-24 pt-10 lg:px-10"
      >
        <Header user={user} />

        <motion.section
          layout
          transition={LAYOUT_TRANSITION}
          className="grid min-h-[60vh] place-items-center gap-8"
        >
          <div className="text-center space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
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
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <Link href="/">
                <Button variant="primary" size="lg" className="cursor-pointer">
                  Go back home
                </Button>
              </Link>
            </motion.div>
          </div>
        </motion.section>
      </motion.main>
    </FunkyBackground>
  );
}
