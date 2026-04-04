import type { PlanType } from "@/lib/polar";
import type { TeamRole } from "@/lib/teams";

export interface PlanResponse {
  credits: number | null;
  planType: PlanType | null;
  isVatApplicable: boolean;
  /** True if the subscription has a billing issue (past_due or unpaid) */
  hasBillingIssue: boolean;
  /** Team info — present when user is on a team */
  teamId: string | null;
  teamName: string | null;
  teamRole: TeamRole | null;
}
