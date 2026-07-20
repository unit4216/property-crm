// Shared between proxy.ts (edge-ish, no DB access) and lib/session.ts
// (server-only, does DB work) so both agree on the same cookie contract.
export const SESSION_COOKIE = "session_id";
export const SESSION_MAX_AGE = 60 * 60 * 24; // 1 day
