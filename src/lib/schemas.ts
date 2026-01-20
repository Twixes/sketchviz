import { z } from "zod";
import { ASPECT_RATIOS } from "./aspect-ratio";
import { DEFAULT_MODEL_PROVIDER } from "./constants";

// Model schema
export const modelSchema = z.enum([
  "google/gemini-3-pro-image-preview",
  "google/gemini-3-pro-image-preview/4k",
  "google/gemini-2.5-flash-image-preview",
  "bfl/flux-2-klein-9b/1k",
  "bfl/flux-2-klein-9b/1.5k",
]);

export type Model = z.infer<typeof modelSchema>;

// Aspect ratio schema
export const aspectRatioSchema = z.enum(ASPECT_RATIOS);

export type AspectRatioType = z.infer<typeof aspectRatioSchema>;

// Outdoor light schema
export const outdoorLightSchema = z
  .union([z.enum(["sunny", "overcast", "night"]), z.string().min(1)])
  .nullable();

export type OutdoorLight = z.infer<typeof outdoorLightSchema>;

// Indoor light schema
export const indoorLightSchema = z
  .union([z.enum(["all_off", "all_on"]), z.string().min(1)])
  .nullable();

export type IndoorLight = z.infer<typeof indoorLightSchema>;

// Shared validation: aspect_ratio is required when reference images are provided
function validateAspectRatioWithReferences<
  T extends {
    model?: Model;
    reference_image_urls?: string[] | null;
    aspect_ratio?: AspectRatioType | null;
  },
>(data: T, ctx: z.RefinementCtx) {
  // If reference images are provided, aspect_ratio is required
  if (
    (data.model
      ? data.model.startsWith("google/")
      : DEFAULT_MODEL_PROVIDER === "google") &&
    data.reference_image_urls &&
    data.reference_image_urls.length > 0 &&
    !data.aspect_ratio
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "Aspect ratio is required when using a Google model and providing reference images.",
      path: ["aspect_ratio"],
    });
  }
}

// Generate request schema with conditional aspect_ratio validation
const generateRequestSchemaBase = z.object({
  input_url: z.string().min(1, "Missing input URL."),
  thread_id: z.string().uuid(),
  outdoor_light: outdoorLightSchema.optional(),
  indoor_light: indoorLightSchema.optional(),
  edit_description: z.string().nullable().optional(),
  model: modelSchema.optional(),
  reference_image_urls: z.array(z.string().url()).max(3).optional(),
  aspect_ratio: aspectRatioSchema.nullable().default(null).optional(),
});

export const generateRequestSchema = generateRequestSchemaBase.superRefine(
  validateAspectRatioWithReferences,
);

export type GenerateRequest = z.infer<typeof generateRequestSchema>;

// User params stored in database (excludes input_url which is ephemeral)
export type UserParams = Omit<GenerateRequest, "input_url">;

// Iterate request schema (for refining an existing generation)
const iterateRequestSchemaBase = z.object({
  outdoor_light: outdoorLightSchema.optional(),
  indoor_light: indoorLightSchema.optional(),
  edit_description: z.string().nullable().optional(),
  model: modelSchema.optional(),
  reference_image_urls: z.array(z.string().url()).max(3).optional(),
  aspect_ratio: aspectRatioSchema.nullable().default(null).optional(),
  // When true, uses the base "Turn this SketchUp render..." prompt instead of iteration prompt
  use_base_prompt: z.boolean().optional().default(false),
});

export const iterateRequestSchema = iterateRequestSchemaBase.superRefine(
  validateAspectRatioWithReferences,
);

export type IterateRequest = z.infer<typeof iterateRequestSchema>;
