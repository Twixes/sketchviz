import { z } from "zod";

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
});

export type GenerateRequest = z.infer<typeof generateRequestSchema>;

// User params stored in database (excludes blobUrl which is ephemeral)
export type UserParams = Omit<GenerateRequest, "blobUrl">;
