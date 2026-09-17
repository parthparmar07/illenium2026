import { z } from "zod";

export const participantSchema = z.object({
  fullName: z.string().min(1, "Full name is required").max(100),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional().or(z.literal("")),
  password: z.string().optional().or(z.literal("")),
  collegeId: z.string().optional().or(z.literal("")),
  collegeRollNumber: z.string().optional().or(z.literal("")),
  emergencyName: z.string().optional().or(z.literal("")),
  emergencyPhone: z.string().optional().or(z.literal("")),
  eventIds: z.array(z.string()).optional().default([])
});

export const manualLookupSchema = z.object({ illeniumId: z.string().regex(/^ILL-26-\d{6}$/, "Use ILL-26-000123 format") });

export const checkinSchema = z.object({
  token: z.string().min(3, "Token or ID is required").max(300),
  eventId: z.string().optional().or(z.literal("")),
  checkInType: z.enum(["campus_entry", "event_entry"])
});
