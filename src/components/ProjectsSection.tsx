"use client";

import { ArrowRightIcon, PlusIcon } from "@radix-ui/react-icons";
import { motion } from "motion/react";
import Link from "next/link";
import { ProjectCard } from "@/components/ProjectCard";
import { useProjectsQuery } from "@/hooks/use-projects-query";
import { Button } from "@/lib/components/ui/Button";

export function RecentProjects() {
  const { data: projects, isLoading } = useProjectsQuery();

  if (isLoading) {
    return (
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-black">Projects</h2>
        </div>
        <div className="rounded-xl border border-black/10 bg-white/75 p-8 text-center">
          <p className="text-black/50">Loading...</p>
        </div>
      </section>
    );
  }

  if (!projects || projects.length === 0) {
    return (
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-black">Projects</h2>
        </div>
        <div className="rounded-xl border border-dashed border-black/20 bg-white/50 p-6 text-center">
          <p className="text-sm text-black/50">
            No projects yet. Create one for consistent multi-scene
            visualizations.
          </p>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<PlusIcon />}
            link="/projects/new"
            className="mt-3"
          >
            New project
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-black">Projects</h2>
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<PlusIcon />}
          link="/projects/new"
          className="mt-3"
        >
          New project
        </Button>
      </div>
      <motion.div className="grid gap-6 md:grid-cols-2">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </motion.div>
    </section>
  );
}
