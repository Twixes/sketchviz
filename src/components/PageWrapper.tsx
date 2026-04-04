"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { LAYOUT_TRANSITION } from "@/lib/animation-constants";
import { EditableTitle } from "./EditableTitle";
import { Header } from "./Header";
import { NeonBackground } from "./NeonBackground";
import type { SessionUser } from "./SessionProvider";
import { TeamInvitationBanner } from "./TeamInvitationBanner";

interface PageWrapperProps {
  user: SessionUser | null;
  children: ReactNode;
  /** Gap between content items (title, children). Defaults to 'normal' (gap-12). */
  gap?: "small" | "normal" | "large";
  /** Maximum width of the content area. Defaults to 'normal' (max-w-6xl). */
  maxWidth?: "normal" | "narrow";
  /** Page title displayed as h1. */
  title?: ReactNode;
  /** Page description displayed below the title. */
  description?: ReactNode;
  /** Document title for the browser tab. If provided, renders as "{documentTitle} • SketchViz". */
  documentTitle?: string;
  /** If provided (and title is a string), renders the title as an EditableTitle. Called when the user saves a new title. */
  onTitleSave?: (newTitle: string) => void;
}

const gapClasses = {
  small: "gap-8",
  normal: "gap-12",
  large: "gap-16",
} as const;

const maxWidthClasses = {
  normal: "max-w-6xl",
  narrow: "max-w-5xl",
} as const;

export function PageWrapper({
  user,
  children,
  gap = "normal",
  maxWidth = "normal",
  title,
  description,
  documentTitle,
  onTitleSave,
}: PageWrapperProps) {
  // documentTitle is used for type-safety; actual title is set via layout metadata
  void documentTitle;

  // Outer main always uses gap-12 (consistent Header-to-content spacing)
  // The gap prop controls spacing within the content section
  const className = `relative z-10 mx-auto flex grow w-full ${maxWidthClasses[maxWidth]} flex-col gap-12 px-6 pb-24 pt-10 lg:px-10`;

  const content = (
    <>
      <Header user={user} />
      {user && <TeamInvitationBanner />}
      <section className={`flex grow flex-col ${gapClasses[gap]}`}>
        {(title || description) && (
          <div>
            {title &&
              (onTitleSave && typeof title === "string" ? (
                <EditableTitle title={title} onSave={onTitleSave} />
              ) : typeof title === "string" ? (
                <h1 className="text-2xl lg:text-3xl font-semibold text-black">
                  {title}
                </h1>
              ) : (
                title
              ))}
            {description && (
              <p className="mt-2 text-lg text-black/70">{description}</p>
            )}
          </div>
        )}
        {children}
      </section>
    </>
  );

  return (
    <NeonBackground>
      <motion.main transition={LAYOUT_TRANSITION} className={className}>
        {content}
      </motion.main>
    </NeonBackground>
  );
}
