import { z } from "zod";

// Light conditions schema
export const lightConditionsSchema = z
  .enum(["sunny", "overcast", "night"])
  .nullable();

export type LightConditions = z.infer<typeof lightConditionsSchema>;

// Generate request schema
export const generateRequestSchema = z.object({
  blobUrl: z.string().min(1, "Missing blob URL."),
  outside_light_conditions: lightConditionsSchema.optional(),
  edit_description: z.string().nullable().optional(),
});

export type GenerateRequest = z.infer<typeof generateRequestSchema>;
