import { z } from "zod";

export const participantSchema = z.object({
  fullName: z.string().min(2).max(100), email: z.string().email(), phone: z.string().min(8).max(20),
  collegeId: z.string().uuid(), collegeRollNumber: z.string().min(2).max(40),
  emergencyName: z.string().min(2).max(100), emergencyPhone: z.string().min(8).max(20),
  eventIds: z.array(z.string().uuid()).max(10)
});

export const manualLookupSchema = z.object({ illeniumId: z.string().regex(/^ILL-26-\d{6}$/, "Use ILL-26-000123 format") });
export const checkinSchema = z.object({ token: z.string().min(20).max(300), eventId: z.string().uuid().optional(), checkInType: z.enum(["campus_entry", "event_entry"]) });
