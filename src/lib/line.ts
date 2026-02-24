import liff from "@line/liff";

const KEY = "line_user_id_v1";
const LIFF_ID = process.env.NEXT_PUBLIC_LIFF_ID || "";

export function getCachedLineUserId() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(KEY);
}

export async function ensureLineLogin(): Promise<string> {
  // 0. 檢查 LIFF_ID 是否存在
  if (!LIFF_ID) {
    throw new Error("NEXT_PUBLIC_LIFF_ID 環境變數未設置！請檢查 .env.local 文件");
  }

  // 1. 檢查是否已有快取的 user_id
  const cached = getCachedLineUserId();
  if (cached) return cached;

  // 2. 初始化 LIFF（如果尚未初始化）
  if (!liff.isInClient()) {
    // 在瀏覽器中，需要先初始化
    try {
      await liff.init({ liffId: LIFF_ID });
    } catch (error: any) {
      console.error("LIFF init error:", error);
      throw new Error(`LIFF 初始化失敗: ${error?.message || String(error)}`);
    }
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