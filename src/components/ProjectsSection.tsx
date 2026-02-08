"use client";

import { PlusIcon } from "@radix-ui/react-icons";
import { motion } from "motion/react";
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-dashed border-black/20 bg-white/75 p-6 text-center"
    >
      <p className="text-sm text-black/50">
        No projects yet. Create one for consistent multi-scene visualizations.
      </p>
      <Button
        variant="secondary"
        size="sm"
        leftIcon={<PlusIcon />}
        onClick={() => useProjectStore.getState().openModal()}
        className="mt-3"
      >
        New project
      </Button>
    </motion.div>
  );
}
