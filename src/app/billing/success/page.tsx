"use client";

import { motion } from "motion/react";
import Link from "next/link";
import Confetti from "react-confetti";
import { PageWrapper } from "@/components/PageWrapper";
import { useSession } from "@/components/SessionProvider";
import { FADE_TRANSITION, fadeInUp } from "@/lib/animation-constants";
import { Button } from "@/lib/components/ui/Button";

export default function BillingSuccessPage() {
  const { user } = useSession();

  return (
    <>
      {typeof window !== "undefined" && (
        <Confetti recycle={false} numberOfPieces={500} gravity={0.3} />
      )}

      <PageWrapper user={user} gap="large">
        <motion.section
          {...fadeInUp}
          transition={FADE_TRANSITION}
          className="flex flex-col items-center justify-center grow text-center space-y-8"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 15,
              delay: 0.2,
            }}
            className="text-7xl mb-4"
          >
            🎉
          </motion.div>

          <div className="space-y-4">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...FADE_TRANSITION, delay: 0.3 }}
              className="text-4xl md:text-5xl font-bold"
            >
              Welcome to SketchViz Pro
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...FADE_TRANSITION, delay: 0.4 }}
              className="text-lg md:text-xl text-muted-foreground max-w-3xl"
            >
              Thank you for subscribing! You now have 1,000 credits included
              each&nbsp;month, unlimited&nbsp;
              <span className="whitespace-nowrap">pay-as-you-go</span> usage
              beyond&nbsp;that – and&nbsp;priority&nbsp;support via&nbsp;
              <Link
                href="mailto:support@sketchviz.app"
                className="underline decoration-dashed"
              >
                support@sketchviz.app
              </Link>
              .
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...FADE_TRANSITION, delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Button size="lg" link="/dashboard">
              Get back to creating
            </Button>
            <Button size="lg" variant="secondary" link="/billing/portal">
              Manage subscription
            </Button>
          </motion.div>
        </motion.section>
      </PageWrapper>
    </>
  );
}
