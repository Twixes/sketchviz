import type { Model } from "./schemas";

export function determineCreditCostOfImageGeneration({
  model,
  referenceImageCount = 0,
}: {
  model: Model;
  referenceImageCount?: number;
}): number {
  // Each credit costs the user 0.015 USD, but our calculation is `cost_of_image_output / 0.01` for a general 50% margin
  if (model === "google/gemini-3-pro-image-preview") {
    return 14; // Each 2K output image is 0.139 USD
  }
  if (model === "google/gemini-3-pro-image-preview/4k") {
    return 24; // Each 4K output image is 0.24 USD
  }
  if (model === "google/gemini-2.5-flash-image-preview") {
    return 4; // Each output image is 0.04 USD
  }
  if (model === "bfl/flux-2-klein-9b/1k") {
    return 3 + referenceImageCount; // Base 2 credits + 1 per reference image (1K/1MP)
  }
  if (model === "bfl/flux-2-klein-9b/1.5k") {
    return 5 + referenceImageCount; // Base 4 credits + 1 per reference image (1.5K/2MP)
  }
  return 0;
}
