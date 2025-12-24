import { ClockIcon, ExitIcon } from "@radix-ui/react-icons";
import type { User } from "@supabase/supabase-js";
import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import GoogleIcon from "@/icons/google.svg";

const FADE_TRANSITION = { duration: 0.35, ease: "easeOut" } as const;

interface HeaderProps {
  user: User | null;
  onReset: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  onSignIn: () => Promise<void>;
  onSignOut: () => Promise<void>;
}

export function Header({ user, onReset, onSignIn, onSignOut }: HeaderProps) {
  return (
    <motion.header
      initial={false}
      transition={FADE_TRANSITION}
      className="flex items-center justify-between z-10"
    >
      <a
        href="/"
        onClick={onReset}
        className="flex items-center gap-4 cursor-pointer"
      >
        <Image
          src="/icon.png"
          alt="SketchViz"
          className="size-16 -m-1"
          width={64}
          height={64}
        />
        <div>
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
            onClick={onSignOut}
            className="flex items-center gap-2 rounded-xl border border-black/20 bg-white/75 px-4 py-2 text-sm font-medium text-black transition-all hover:bg-black/5 hover:border-black/30"
          >
            <ExitIcon /> Log out
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={onSignIn}
          className="flex items-center gap-2 rounded-xl border border-black/20 bg-white/75 px-4 py-2 text-sm font-medium text-black transition-all hover:bg-black/5 hover:border-black/30"
        >
          <GoogleIcon className="size-[15px]" /> Log in with Google
        </button>
      )}
    </motion.header>
  );
}
