"use client";

import { useQuery } from "@tanstack/react-query";
import { DashboardStats } from "@/components/DashboardStats";
import { Examples } from "@/components/Examples";
import { NeonShapesDashboard } from "@/components/NeonShapesDashboard";
import { NeonShapesHero } from "@/components/NeonShapesHero";
import { PageWrapper } from "@/components/PageWrapper";
import { RecentThreads } from "@/components/RecentThreads";
import type { SessionUser } from "@/components/SessionProvider";
import { useSession } from "@/components/SessionProvider";
import { UpgradeBanner } from "@/components/UpgradeBanner";
import { UploadDropzone } from "@/components/UploadDropzone";
import { usePlanQuery } from "@/hooks/use-plan-query";
import { extractFirstName } from "@/lib/language-utils";

interface DashboardProps {
  user: SessionUser;
  onFileSelected: (file: File) => void;
}

export function Dashboard({ user, onFileSelected }: DashboardProps) {
  const { supabase } = useSession();
  const { data: planData } = usePlanQuery();

  const isFreeUser = planData?.planType === "free";

  // Check if user has any threads (to determine empty state)
  const { data: hasThreads, isLoading: isLoadingThreads } = useQuery({
    queryKey: ["has-threads", user.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("threads")
        .select("*", { count: "exact", head: true });

      if (error) {
        console.error("Failed to check threads:", error);
        return false;
      }

      return (count ?? 0) > 0;
    },
    enabled: !!user,
    staleTime: 30_000,
  });

  const firstName = extractFirstName(user.user_metadata.full_name);
  const hour = new Date().getHours();
  const timeGreeting =
    hour < 5
      ? "Burning the midnight oil"
      : hour < 12
        ? "How's your morning"
        : hour < 17
          ? "Good afternoon"
          : hour < 21
            ? "Good evening"
            : "Working late";
  const isQuestion = timeGreeting.startsWith("How");
  const punctuation = isQuestion ? "?" : "!";
  const greeting = firstName
    ? `${timeGreeting}, ${firstName}${punctuation}`
    : `${timeGreeting}${punctuation}`;

  // Empty state for new users
  if (!isLoadingThreads && !hasThreads) {
    return (
      <PageWrapper
        user={user}
        title={greeting}
        documentTitle="Dashboard"
        gap="small"
      >
        <NeonShapesDashboard>
          <section className="space-y-6">
            <div className="relative">
              <NeonShapesHero />
              <UploadDropzone
                onFileSelected={onFileSelected}
                className="min-h-[320px] border-dashed"
              />
            </div>
            <div className="text-center">
              <p className="text-lg text-black/60">
                Create your first visualization to get started
              </p>
            </div>
            <Examples />
          </section>
        </NeonShapesDashboard>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper
      user={user}
      title={greeting}
      documentTitle="Dashboard"
      gap="small"
    >
      <NeonShapesDashboard>
        <section className="space-y-6">
          <DashboardStats />
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-black">New render</h2>
            <div className="relative">
              <UploadDropzone
                onFileSelected={onFileSelected}
                className="min-h-[200px] border-dashed"
              />
            </div>
          </section>
          {isFreeUser && <UpgradeBanner />}
          <RecentThreads />
        </section>
      </NeonShapesDashboard>
    </PageWrapper>
  );
}
