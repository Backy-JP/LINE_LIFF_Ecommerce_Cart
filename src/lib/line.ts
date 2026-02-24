import liff from "@line/liff";

const KEY = "line_user_id_v1";

export function getCachedLineUserId() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(KEY);
}

export async function ensureLineLogin(): Promise<string> {
  const cached = getCachedLineUserId();
  if (cached) return cached;

  await liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! });

  if (!liff.isLoggedIn()) {
    liff.login();
    throw new Error("Redirecting to LINE login...");
  }

  const profile = await liff.getProfile();
  localStorage.setItem(KEY, profile.userId);
  return profile.userId;
}