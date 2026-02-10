"use client";

import { PlusIcon } from "@radix-ui/react-icons";
import { motion } from "motion/react";
import { NeonShape } from "@/components/NeonShape";
import { ProjectCard } from "@/components/ProjectCard";
import { useProjectsQuery } from "@/hooks/use-projects-query";
import { Button } from "@/lib/components/ui/Button";
import { useProjectStore } from "@/stores/project-store";

export function RecentProjects() {
  const { data: projects, isLoading } = useProjectsQuery();

  if (isLoading) {
    return (
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-black">
            Projects
            <span className="ml-2 align-middle rounded-md bg-black/10 px-1.5 py-0.5 text-xs font-medium text-black/50">
              BETA
            </span>
          </h2>
        </div>
        <div className="rounded-xl border border-black/10 bg-white/75 p-8 text-center">
          <p className="text-black/50">Loading...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-black">
          Projects
          <span className="ml-2 align-middle rounded-md bg-black/10 px-1.5 py-0.5 text-xs font-medium text-black/50">
            BETA
          </span>
        </h2>
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<PlusIcon />}
          onClick={() => useProjectStore.getState().openModal()}
          className="mt-3"
        >
          New project
        </Button>
      </div>
      <motion.div className="grid gap-6 md:grid-cols-2">
        {projects && projects.length > 0 ? (
          projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))
        ) : (
          <NewProjectCTACard />
        )}
      </motion.div>
    </section>
  );
}

function NewProjectCTACard() {
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={() => useProjectStore.getState().openModal()}
      className="group relative col-span-full cursor-pointer overflow-hidden rounded-xl border border-black/20 bg-linear-to-br from-black/3 to-black/8 px-8 py-10 text-left transition-colors hover:border-black/40 hover:from-black/5 hover:to-black/12"
    >
      {/* Decorative neon shapes */}
      <NeonShape
        shape="diamond"
        color="pink"
        size="md"
        animation="breathing"
        className="absolute -right-4 -top-4 opacity-40 transition-opacity group-hover:opacity-70"
      />
      <NeonShape
        shape="crescent"
        color="turquoise"
        size="sm"
        animation="breathing"
        className="absolute bottom-2 right-16 opacity-30 transition-opacity group-hover:opacity-60"
      />
      <NeonShape
        shape="zigzag"
        color="violet"
        size="sm"
        animation="breathing"
        className="absolute -left-2 bottom-0 rotate-12 opacity-25 transition-opacity group-hover:opacity-50"
      />

      <div className="relative flex items-center gap-5">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-black/10 transition-colors group-hover:bg-black/15">
          <PlusIcon className="size-6 text-black/60 transition-colors group-hover:text-black/80" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-black">
            Create your first project
          </h3>
          <p className="mt-0.5 text-sm text-black/50">
            Tie multiple scenes together with a shared style and references
          </p>
        </div>
      </div>
    </motion.button>
  );
}
