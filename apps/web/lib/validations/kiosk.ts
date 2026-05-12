import { z } from "zod";

export const registerVisitorSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  birthDate: z.string().optional(),
  contactNumber: z.string().optional(),
  idType: z.string().optional(),
  idNumber: z.string().optional(),
  idPhotoUrl: z.string().url().optional().or(z.literal("")),
  visitorPhotoUrl: z.string().url().optional().or(z.literal("")),
  destinationIds: z.array(z.string()).min(1, "At least one destination is required"),
  reason: z.string().optional(), // Adding a reason field which is common for visits, even if not explicitly in the Visit schema right now, but good to have in payload if needed
});

export type RegisterVisitorInput = z.infer<typeof registerVisitorSchema>;
