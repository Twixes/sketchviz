export interface PlanResponse {
  credits: number | null;
  planType: "free" | "pro";
  isVatApplicable: boolean;
}
