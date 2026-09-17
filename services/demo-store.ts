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

// Global in-memory store for fallback demo mode
const globalStore = globalThis as unknown as { __ILLENIUM_STORE__?: DemoParticipant[] };

if (!globalStore.__ILLENIUM_STORE__) {
  globalStore.__ILLENIUM_STORE__ = [];
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
  }
};
