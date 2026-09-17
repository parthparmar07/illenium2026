export type VerificationStatus = "pending" | "verified" | "rejected";
export type RegistrationStatus = "draft" | "submitted" | "approved" | "rejected";
export type CheckInType = "campus_entry" | "event_entry";
export type ScanResult = { status: "valid" | "invalid" | "pending" | "not_registered" | "already_checked_in"; participant?: { id: string; illenium_id: string; full_name: string; college: string; photo_url?: string | null }; event?: { id: string; name: string }; checkedInAt?: string; message?: string };
