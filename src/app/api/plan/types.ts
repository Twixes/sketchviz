export interface PlanResponse {
  credits: number | null;
  planType: "free" | "pro" | null;
  isVatApplicable: boolean;
}
