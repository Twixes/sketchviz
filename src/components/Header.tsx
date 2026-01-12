import { ClockIcon, ExitIcon, RocketIcon } from "@radix-ui/react-icons";
import type { User } from "@supabase/supabase-js";
import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { usePlanQuery } from "@/hooks/use-plan-query";
import { useSignInCallback } from "@/hooks/use-sign-in-callback";
import { useSignOutCallback } from "@/hooks/use-sign-out-callback";
import GoogleIcon from "@/icons/google.svg";
import { FADE_TRANSITION } from "@/lib/animation-constants";
import { Button } from "@/lib/components/ui/Button";

interface HeaderProps {
  user: User | null;
}

export function Header({ user }: HeaderProps) {
  const handleSignIn = useSignInCallback();
  const handleSignOut = useSignOutCallback();
  const { data: creditsData, isLoading: isLoadingCredits } = usePlanQuery();

  return (
    <motion.header
      initial={false}
      transition={FADE_TRANSITION}
      className="flex flex-wrap items-center justify-between z-10 gap-4"
    >
      <a
        href="/"
        className="flex items-center gap-3 cursor-pointer whitespace-nowrap"
      >
        <Image
          src="/icon.png"
          alt="SketchViz"
          className="size-16 -m-1"
          width={64}
          height={64}
        />
        <p className="text-lg font-semibold tracking-tight leading-tight text-black">
          SketchViz
        </p>
      </a>
      <div className="flex flex-wrap justify-start items-center gap-3 whitespace-nowrap">
        {user ? (
          <>
            {!!user && (
              <div className="flex items-center gap-1.5 rounded-xl border border-dashed border-black/20 px-4 py-2 text-sm font-medium text-black">
                <span className="text-black/50">Credits:</span>
                <span>
                  {isLoadingCredits ? "..." : (creditsData?.credits ?? "none")}
                </span>
              </div>
            )}
            <Link href="/pricing">
              <Button
                variant="secondary"
                leftIcon={<RocketIcon />}
                className="cursor-pointer"
              >
                {creditsData?.planType === "pro" ? "Billing" : "Pricing"}
              </Button>
            </Link>
            <Link href="/threads">
              <Button
                variant="secondary"
                leftIcon={<ClockIcon />}
                className="cursor-pointer"
              >
                Past threads
              </Button>
            </Link>
            <Button
              variant="secondary"
              onClick={handleSignOut}
              leftIcon={<ExitIcon />}
              className="cursor-pointer"
            >
              Log out
            </Button>
          </>
        ) : (
          <>
            <Link href="/pricing">
              <Button
                variant="secondary"
                leftIcon={<RocketIcon />}
                className="cursor-pointer"
              >
                Pricing
              </Button>
            </Link>
            <Button
              variant="secondary"
              onClick={handleSignIn}
              leftIcon={<GoogleIcon />}
              className="cursor-pointer"
            >
              Sign up with Google
            </Button>
          </>
        )}
      </div>
    </motion.header>
  );
}
