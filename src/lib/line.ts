import liff from "@line/liff";

const KEY = "line_user_profile_v2";
const LIFF_ID = process.env.NEXT_PUBLIC_LIFF_ID || "";

export type LineUserProfile = {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
};

export function getCachedLineUserId() {
  if (typeof window === "undefined") return null;
  const cached = localStorage.getItem(KEY);
  if (!cached) return null;
  try {
    const profile: LineUserProfile = JSON.parse(cached);
    return profile.userId;
  } catch {
    return null;
  }
}

export async function ensureLineLogin(): Promise<LineUserProfile> {
  console.log("🔐 [ensureLineLogin] 開始檢查登入狀態");
  
  // 0. 檢查 LIFF_ID 是否存在
  if (!LIFF_ID) {
    throw new Error("NEXT_PUBLIC_LIFF_ID 環境變數未設置！請檢查 .env.local 文件");
  }
  console.log("✅ [ensureLineLogin] LIFF_ID 已設置:", LIFF_ID.slice(0, 10) + "...");

  // 1. 檢查是否已有快取的 profile
  const cached = localStorage.getItem(KEY);
  if (cached) {
    try {
      const profile: LineUserProfile = JSON.parse(cached);
      console.log("✅ [ensureLineLogin] 使用快取的 profile:", profile.displayName);
      return profile;
    } catch {
      // 如果解析失敗，清除快取
      localStorage.removeItem(KEY);
    }
  }
  console.log("⚠️ [ensureLineLogin] 沒有快取的 profile，需要初始化 LIFF");

  // 2. 初始化 LIFF（如果尚未初始化）
  if (!liff.isInClient()) {
    console.log("🔄 [ensureLineLogin] 開始初始化 LIFF...");
    // 在瀏覽器中，需要先初始化
    try {
      await liff.init({ liffId: LIFF_ID });
      console.log("✅ [ensureLineLogin] LIFF 初始化成功");
    } catch (error: any) {
      console.error("❌ [ensureLineLogin] LIFF init error:", error);
      throw new Error(`LIFF 初始化失敗: ${error?.message || String(error)}`);
    }
  }

  // 3. 如果未登入，導向 LINE 登入（會離開頁面）
  const isLoggedIn = liff.isLoggedIn();
  console.log("🔍 [ensureLineLogin] 登入狀態:", isLoggedIn);
  
  if (!isLoggedIn) {
    // 指定登入後回到當前頁面
    const redirectUri = window.location.href;
    console.log("🔄 [ensureLineLogin] 導向 LINE 登入，回調 URI:", redirectUri);
    liff.login({ redirectUri });
    // 這行之後的程式碼不會執行，因為已經跳轉了
    throw new Error("Redirecting to LINE login...");
  }

  // 4. 已登入，取得完整 profile 並快取
  console.log("📝 [ensureLineLogin] 取得用戶 profile...");
  const profile = await liff.getProfile();
  
  const userProfile: LineUserProfile = {
    userId: profile.userId,
    displayName: profile.displayName,
    pictureUrl: profile.pictureUrl,
    statusMessage: profile.statusMessage,
  };
  
  console.log("✅ [ensureLineLogin] Profile 取得成功:", userProfile.displayName, `(${userProfile.userId})`);
  localStorage.setItem(KEY, JSON.stringify(userProfile));
  return userProfile;
}