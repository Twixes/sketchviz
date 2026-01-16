import {
  ClockIcon,
  ExitIcon,
  InfoCircledIcon,
  RocketIcon,
  UploadIcon,
} from "@radix-ui/react-icons";
import { motion } from "motion/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { JSX } from "react";
import { useCallback, useMemo, useRef, useState } from "react";
import { uuidv7 } from "uuidv7";
import { usePlanQuery } from "@/hooks/use-plan-query";
import { useSignInCallback } from "@/hooks/use-sign-in-callback";
import { useSignOutCallback } from "@/hooks/use-sign-out-callback";
import { useUploadMutation } from "@/hooks/use-upload-mutation";
import GoogleIcon from "@/icons/google.svg";
import { FADE_TRANSITION } from "@/lib/animation-constants";
import { Button } from "@/lib/components/ui/Button";
import { ACCEPTED_MIME_TYPES } from "@/lib/constants";
import { useThreadEditorStore } from "@/stores/thread-editor-store";
import type { SessionUser } from "./SessionProvider";

interface HeaderProps {
  user: SessionUser | null;
}

export function Header({ user }: HeaderProps) {
  const handleSignIn = useSignInCallback();
  const handleSignOut = useSignOutCallback();

  return (
    <motion.header
      initial={false}
      transition={FADE_TRANSITION}
      className="flex flex-wrap items-center justify-between z-10 gap-2 md:gap-4"
    >
      <div className="flex items-center flex-wrap gap-2 md:gap-4">
        <a
          href="/"
          className="flex items-center gap-2 md:gap-3 cursor-pointer whitespace-nowrap"
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
        {user && <CreditsButton />}
      </div>
      <div className="flex flex-wrap justify-end items-center gap-2 md:gap-3 whitespace-nowrap">
        {user ? (
          <>
            <NewRenderButton />
            <Button
              variant="secondary"
              leftIcon={<ClockIcon />}
              className="cursor-pointer"
              link="/threads"
              tooltip="View your past visualizations"
            >
              History
            </Button>
            <Button
              variant="secondary"
              leftIcon={<RocketIcon />}
              className="cursor-pointer"
              link="/pricing"
            >
              Pricing
            </Button>
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
            <Button
              variant="secondary"
              leftIcon={<RocketIcon />}
              className="cursor-pointer"
              link="/pricing"
            >
              Pricing
            </Button>
            <Button
              variant="secondary"
              onClick={handleSignIn}
              leftIcon={<GoogleIcon />}
              className="cursor-pointer"
            >
              Sign in with Google
            </Button>
          </>
        )}
      </div>
    </motion.header>
  );
}

function CreditsButton(): JSX.Element {
  const { data: creditsData, isLoading: isLoadingCredits } = usePlanQuery();
  const [isLoadingBillingPortal, setIsLoadingBillingPortal] = useState(false);

  return (
    <Button
      variant="secondary"
      size="md"
      link="/billing/portal"
      className="border-dashed bg-transparent hover:border-black/40 hover:bg-black/5 gap-1.5"
      rightIcon={<InfoCircledIcon />}
      onClick={() => setIsLoadingBillingPortal(true)}
      loading={isLoadingBillingPortal}
      tooltip={
        <>
          {!isLoadingCredits &&
            (creditsData?.planType === "pro" ? (
              <>
                The Pro plan includes 1,000 credits per month.
                <br />
                Usage beyond that is pay-as-you-go at $0.015/credit.
              </>
            ) : (
              <>
                This is your free monthly allowance.
                <br />
                Upgrade to Pro for unlimited rendering.
              </>
            ))}
          <br />
          Click to manage your plan
        </>
      }
    >
      <span className="text-black/50">Credits left:</span>
      {isLoadingCredits ? (
        "..."
      ) : creditsData && creditsData.planType === "pro" ? (
        <>
          <span className="text-xl leading-none">∞</span>
          <span className="text-black/40 font-normal">
            {creditsData.credits !== null &&
              (creditsData.credits > 0
                ? `(included in plan: ${creditsData.credits})`
                : `(pay-as-you-go: ${Math.abs(creditsData.credits)})`)}
          </span>
        </>
      ) : (
        <span>{creditsData?.credits ?? "..."}</span>
      )}
    </Button>
  );
}

function NewRenderButton(): JSX.Element {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const accept = useMemo(() => ACCEPTED_MIME_TYPES.join(","), []);
  const { setTentativeThreadId, reset } = useThreadEditorStore();
  const uploadMutation = useUploadMutation();
  const router = useRouter();

  const handleFileSelected = useCallback(
    (file: File) => {
      const threadId = uuidv7();
      reset();
      setTentativeThreadId(threadId);
      uploadMutation.mutate({ file });
      router.push(`/threads/${threadId}`);
    },
    [uploadMutation, router, setTentativeThreadId, reset],
  );

  return (
    <>
      <Button
        variant="primary"
        leftIcon={<UploadIcon />}
        className="cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
        tooltip="Select a raw SketchUp render to visualize"
      >
        New render
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            handleFileSelected(file);
            event.target.value = "";
          }
        }}
      />
    </>
  );
}
