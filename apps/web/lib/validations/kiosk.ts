import { z } from "zod";

export const registerVisitorSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  idPhotoUrl: z.string().optional().or(z.literal("")),
  visitorPhotoUrl: z.string().optional().or(z.literal("")),
  destinationIds: z.array(z.string()).min(1, "At least one destination is required"),
  reason: z.string().optional(),
});

export type RegisterVisitorInput = z.infer<typeof registerVisitorSchema>;
