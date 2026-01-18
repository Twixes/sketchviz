import { ArrowLeftIcon, LockClosedIcon } from "@radix-ui/react-icons";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { checkAdminAccess } from "@/lib/admin";
import { Button } from "@/lib/components/ui/Button";
import { createClient } from "@/lib/supabase/server";
import { UserTableContainer } from "./UserTableContainer";
import { UserTableSkeleton } from "./UserTableSkeleton";

export const metadata: Metadata = {
  title: "Admin",
};

interface AdminPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const supabase = await createClient();
  const { isAdmin, email } = await checkAdminAccess(supabase);

  if (!isAdmin) {
    redirect("/");
  }

  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-white">
      <main className="mx-auto max-w-6xl px-6 pb-24 pt-10 lg:px-10">
        {/* Admin Header */}
        <header className="flex flex-wrap items-center justify-between gap-4 mb-12">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/icon.png"
                alt="SketchViz"
                className="size-12 -m-1"
                width={48}
                height={48}
              />
              <span className="text-lg font-semibold tracking-tight text-black">
                SketchViz
              </span>
            </Link>
            <span className="flex items-center gap-1.5 rounded-lg bg-amber-100 border border-amber-200 px-2.5 py-1 text-xs font-semibold text-amber-800">
              <LockClosedIcon className="size-3" />
              Admin
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-black/50">{email}</span>
            <Button variant="secondary" size="sm" link="/">
              <ArrowLeftIcon className="size-4" />
              Back to app
            </Button>
          </div>
        </header>

        {/* Page Title */}
        <section className="mb-8">
          <h1 className="text-3xl font-semibold text-black">User Management</h1>
          <p className="mt-2 text-black/60">
            View users and manage their credits
          </p>
        </section>

        {/* User Table with Suspense */}
        <section className="space-y-6">
          <Suspense
            key={page}
            fallback={
              <>
                <div className="h-5 w-32 animate-pulse rounded bg-black/10" />
                <UserTableSkeleton />
              </>
            }
          >
            <UserTableContainer page={page} />
          </Suspense>
        </section>
      </main>
    </div>
  );
}
