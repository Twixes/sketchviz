"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "@radix-ui/react-icons";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Button } from "@/lib/components/ui/Button";

interface PaginationProps {
  page: number;
  totalPages: number;
}

export function Pagination({ page, totalPages }: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handlePageChange = useCallback(
    (newPage: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", String(newPage));
      router.push(`/admin?${params.toString()}`);
    },
    [router, searchParams],
  );

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2">
      <Button
        variant="secondary"
        size="sm"
        disabled={page === 1}
        onClick={() => handlePageChange(page - 1)}
        leftIcon={<ChevronLeftIcon />}
      >
        Previous
      </Button>
      <span className="px-4 text-sm text-black/60">
        Page {page} of {totalPages}
      </span>
      <Button
        variant="secondary"
        size="sm"
        disabled={page === totalPages}
        onClick={() => handlePageChange(page + 1)}
        rightIcon={<ChevronRightIcon />}
      >
        Next
      </Button>
    </div>
  );
}
