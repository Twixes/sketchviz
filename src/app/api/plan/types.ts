export interface PlanResponse {
  credits: number | null;
  planType: "free" | "pro" | null;
  isVatApplicable: boolean;
  /** True if the user's subscription has a billing issue (past_due or unpaid) */
  hasBillingIssue: boolean;
}
