export type Role = "participant" | "oc" | "admin" | "executive_core";
export function canManage(role: Role | null) { return role === "admin" || role === "executive_core"; }
export function canOperate(role: Role | null) { return role === "oc" || canManage(role); }
