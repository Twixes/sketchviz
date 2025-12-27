import { ClockIcon, ExitIcon } from "@radix-ui/react-icons";
import type { User } from "@supabase/supabase-js";
import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useSignInCallback } from "@/hooks/use-sign-in-callback";
import { useSignOutCallback } from "@/hooks/use-sign-out-callback";
import GoogleIcon from "@/icons/google.svg";

const FADE_TRANSITION = { duration: 0.35, ease: "easeOut" } as const;

interface HeaderProps {
  user: User | null;
  onLogoClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

export function Header({ user, onLogoClick }: HeaderProps) {
  const handleSignIn = useSignInCallback();
  const handleSignOut = useSignOutCallback();

  return (
    <motion.header
      initial={false}
      transition={FADE_TRANSITION}
      className="flex flex-wrap items-center justify-between z-10 gap-4"
    >
      <a
        href="/"
        onClick={onLogoClick}
        className="flex items-center gap-4 cursor-pointer whitespace-nowrap"
      >
        <Image
          src="/icon.png"
          alt="SketchViz"
          className="size-16 -m-1"
          width={64}
          height={64}
        />
        <div className="text-left">
          <p className="text-base font-semibold tracking-tight text-black">
            SketchViz
          </p>
          <p className="text-xs text-black/50">AI visualization studio</p>
        </div>
      </a>
      {user ? (
        <div className="flex items-center gap-3">
          <Link
            href="/threads"
            className="flex items-center gap-2 rounded-xl border border-black/20 bg-white/75 px-4 py-2 text-sm font-medium text-black transition-all hover:bg-black/5 hover:border-black/30"
          >
            <ClockIcon /> Past threads
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            className="flex items-center gap-2 rounded-xl border border-black/20 bg-white/75 px-4 py-2 text-sm font-medium text-black transition-all hover:bg-black/5 hover:border-black/30 cursor-pointer"
          >
            <ExitIcon /> Log out
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleSignIn}
          className="flex items-center gap-2 rounded-xl border border-black/20 bg-white/75 px-4 py-2 text-sm font-medium text-black transition-all hover:bg-black/5 hover:border-black/30"
        >
          <GoogleIcon className="size-[15px]" /> Log in with Google
        </button>
      )}
    </motion.header>
  );
}
