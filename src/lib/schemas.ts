import { z } from "zod";

// Outdoor light schema
export const outdoorLightSchema = z
  .enum(["sunny", "overcast", "night"])
  .nullable();

export type OutdoorLight = z.infer<typeof outdoorLightSchema>;

// Indoor light schema
export const indoorLightSchema = z.enum(["all_off", "all_on"]).nullable();

export type IndoorLight = z.infer<typeof indoorLightSchema>;

// Generate request schema
export const generateRequestSchema = z.object({
  blobUrl: z.string().min(1, "Missing blob URL."),
  outdoor_light: outdoorLightSchema.optional(),
  indoor_light: indoorLightSchema.optional(),
  edit_description: z.string().nullable().optional(),
});

export type GenerateRequest = z.infer<typeof generateRequestSchema>;
