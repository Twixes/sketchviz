"use client";

import clsx from "clsx";
import { motion } from "motion/react";
import type { ReactNode } from "react";
import { LAYOUT_TRANSITION } from "@/lib/animation-constants";
import { EditableTitle } from "./EditableTitle";
import { Header } from "./Header";
import { NeonBackground } from "./NeonBackground";
import type { SessionUser } from "./SessionProvider";

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

  return (
    <NeonBackground>
      <div
        className={
          // Outer main always uses gap-12 (consistent Header-to-content spacing)
          // The gap prop controls spacing within the content section
          "flex flex-col items-center mx-auto grow max-w-6xl w-full gap-12 px-6 pb-24 pt-10 lg:px-10"
        }
      >
        <Header user={user} />
        <motion.main
          transition={LAYOUT_TRANSITION}
          className={clsx(
            `flex grow flex-col w-full ${gapClasses[gap]}`,
            maxWidth === "narrow" ? "max-w-4xl" : "max-w-6xl",
          )}
        >
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
        </motion.main>
      </div>
    </NeonBackground>
  );
}
