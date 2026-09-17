export type DemoParticipant = {
  id: string;
  fullName: string;
  email: string;
  college: string;
  collegeRollNumber: string;
  verificationStatus: "pending" | "verified" | "rejected";
  registrationStatus: "submitted" | "approved" | "rejected";
  illeniumId?: string;
  events: { name: string; category: string; venue: string }[];
  createdAt: string;
};

export type DemoCheckIn = {
  id: string;
  participantId: string;
  fullName: string;
  illeniumId: string;
  checkInType: "campus_entry" | "event_entry";
  eventName?: string;
  venue?: string;
  scannedAt: string;
  attendanceStatus: string;
};

// Global in-memory store for fallback demo mode
const globalStore = globalThis as unknown as {
  __ILLENIUM_STORE__?: DemoParticipant[];
  __ILLENIUM_CHECKINS__?: DemoCheckIn[];
};

if (!globalStore.__ILLENIUM_STORE__) {
  globalStore.__ILLENIUM_STORE__ = [];
}
if (!globalStore.__ILLENIUM_CHECKINS__) {
  globalStore.__ILLENIUM_CHECKINS__ = [];
}

export const demoStore = {
  getAll: () => globalStore.__ILLENIUM_STORE__ || [],
  add: (item: DemoParticipant) => {
    if (!globalStore.__ILLENIUM_STORE__) globalStore.__ILLENIUM_STORE__ = [];
    const index = globalStore.__ILLENIUM_STORE__.findIndex((p) => p.email.toLowerCase() === item.email.toLowerCase());
    if (index >= 0) {
      globalStore.__ILLENIUM_STORE__[index] = item;
    } else {
      globalStore.__ILLENIUM_STORE__.unshift(item);
    }
  },
  approve: (participantId: string) => {
    const list = globalStore.__ILLENIUM_STORE__ || [];
    const p = list.find((item) => item.id === participantId);
    if (p) {
      const nextNum = list.filter((i) => i.illeniumId).length + 1;
      p.illeniumId = `ILL-26-${String(nextNum).padStart(6, "0")}`;
      p.verificationStatus = "verified";
      p.registrationStatus = "approved";
      return p;
    }
    return null;
  },

  getCheckIns: () => globalStore.__ILLENIUM_CHECKINS__ || [],
  addCheckIn: (checkIn: DemoCheckIn): { ok: boolean; message: string } => {
    if (!globalStore.__ILLENIUM_CHECKINS__) globalStore.__ILLENIUM_CHECKINS__ = [];
    
    // Check for duplicate check-in
    const exists = globalStore.__ILLENIUM_CHECKINS__.some(
      (c) =>
        c.participantId === checkIn.participantId &&
        c.checkInType === checkIn.checkInType &&
        (c.eventName === checkIn.eventName || (!c.eventName && !checkIn.eventName))
    );

    if (exists) {
      return { ok: false, message: "Already checked in." };
    }

    globalStore.__ILLENIUM_CHECKINS__.unshift(checkIn);
    return { ok: true, message: "Check-in recorded successfully." };
  }
};
