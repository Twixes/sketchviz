import { z } from "zod";
import { ASPECT_RATIOS } from "./aspect-ratio";

// Model schema
export const modelSchema = z.enum([
  "google/gemini-3-pro-image-preview",
  "google/gemini-2.5-flash-image-preview",
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

// Generate request schema with conditional aspect_ratio validation
const generateRequestSchemaBase = z.object({
  blobUrl: z.string().min(1, "Missing blob URL."),
  outdoor_light: outdoorLightSchema.optional(),
  indoor_light: indoorLightSchema.optional(),
  edit_description: z.string().nullable().optional(),
  model: modelSchema.optional(),
  reference_image_urls: z.array(z.string().url()).max(3).optional(),
  aspect_ratio: aspectRatioSchema.nullable().default(null).optional(),
});

export const generateRequestSchema = generateRequestSchemaBase.superRefine(
  (data, ctx) => {
    // If reference images are provided, aspect_ratio is required
    if (
      data.reference_image_urls &&
      data.reference_image_urls.length > 0 &&
      !data.aspect_ratio
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Aspect ratio is required when reference images are provided, due to Gemini limitations.",
        path: ["aspect_ratio"],
      });
    }
  },
);

export type GenerateRequest = z.infer<typeof generateRequestSchema>;

// User params stored in database (excludes blobUrl which is ephemeral)
export type UserParams = Omit<GenerateRequest, "blobUrl">;
