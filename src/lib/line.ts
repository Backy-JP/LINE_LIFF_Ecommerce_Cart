import liff from "@line/liff";

const KEY = "line_user_id_v1";

export function getCachedLineUserId() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(KEY);
}

export async function ensureLineLogin(): Promise<string> {
  // 1. 檢查是否已有快取的 user_id
  const cached = getCachedLineUserId();
  if (cached) return cached;

  // 2. 初始化 LIFF
  if (!liff.isInClient() && !liff.isLoggedIn()) {
    await liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! });
  }

  // 3. 如果未登入，導向 LINE 登入（會離開頁面）
  if (!liff.isLoggedIn()) {
    liff.login();
    // 這行之後的程式碼不會執行，因為已經跳轉了
    throw new Error("Redirecting to LINE login...");
  }

  // 4. 已登入，取得 profile 並快取
  const profile = await liff.getProfile();
  localStorage.setItem(KEY, profile.userId);
  return profile.userId;
}