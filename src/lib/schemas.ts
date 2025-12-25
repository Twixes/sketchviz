import { z } from "zod";

// Model schema
export const modelSchema = z.enum([
  "google/gemini-3-pro-image-preview",
  "google/gemini-2.5-flash-image-preview",
]);

export type Model = z.infer<typeof modelSchema>;

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

// Generate request schema
export const generateRequestSchema = z.object({
  blobUrl: z.string().min(1, "Missing blob URL."),
  outdoor_light: outdoorLightSchema.optional(),
  indoor_light: indoorLightSchema.optional(),
  edit_description: z.string().nullable().optional(),
  model: modelSchema.optional(),
});

export type GenerateRequest = z.infer<typeof generateRequestSchema>;

// User params stored in database (excludes blobUrl which is ephemeral)
export type UserParams = Omit<GenerateRequest, "blobUrl">;
