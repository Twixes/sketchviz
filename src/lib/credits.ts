import type { Model } from "./schemas";

export function determineCreditCostOfImageGeneration({
  model,
}: {
  model: Model;
}): number {
  // Each credit costs the user 0.015 USD, but our calculation is `cost_of_image_output / 0.01` for a general 50% margin
  if (model === "google/gemini-3-pro-image-preview") {
    return 140; // Each 2K output image is 0.139 USD
  }
  if (model === "google/gemini-2.5-flash-image-preview") {
    return 4; // Each output image is 0.04 USD
  }
  return 0;
}
