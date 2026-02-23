"use client";

import { redirect } from "next/navigation";
import { PageWrapper } from "@/components/PageWrapper";
import { useSession } from "@/components/SessionProvider";
import { EmailSection } from "./EmailSection";
import { PasswordSection } from "./PasswordSection";
import { ThirdPartLogin } from "./ThirdPartyLogin";

export default function AccountPage() {
  const { user, supabase } = useSession();

  if (!user) {
    redirect("/");
  }

  return (
    <PageWrapper user={user} title="Account settings" maxWidth="narrow">
      <div className="space-y-8">
        <EmailSection user={user} supabase={supabase} />
        <PasswordSection supabase={supabase} />
        <ThirdPartLogin supabase={supabase} />
      </div>
    </PageWrapper>
  );
}
