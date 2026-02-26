/**
 * LINE LIFF 整合模組
 * 
 * 此模組負責處理 LINE 登入流程，包括：
 * - LIFF SDK 初始化
 * - 用戶登入狀態檢查
 * - 用戶資料快取管理
 */

import liff from "@line/liff";

// localStorage 的 key，用於儲存用戶資料
const KEY = "line_user_profile_v2";

// 從環境變數讀取 LIFF ID（必須在 .env.local 中設置）
const LIFF_ID = process.env.NEXT_PUBLIC_LIFF_ID || "";

/**
 * LINE 用戶資料的型別定義
 */
export type LineUserProfile = {
  userId: string;          // LINE 用戶的唯一識別碼
  displayName: string;     // 用戶顯示名稱
  pictureUrl?: string;     // 用戶頭像 URL（選填）
  statusMessage?: string;  // 用戶狀態訊息（選填）
};

/**
 * 從 localStorage 取得已快取的 LINE 用戶 ID
 * 
 * @returns {string | null} 用戶 ID，若無快取或解析失敗則返回 null
 */
export function getCachedLineUserId() {
  // SSR 環境下無法使用 localStorage
  if (typeof window === "undefined") return null;
  
  const cached = localStorage.getItem(KEY);
  if (!cached) return null;
  
  try {
    const profile: LineUserProfile = JSON.parse(cached);
    return profile.userId;
  } catch {
    // 如果快取資料格式錯誤，返回 null
    return null;
  }
}

/**
 * 確保用戶已透過 LINE 登入
 * 
 * 此函數會執行以下流程：
 * 1. 檢查 LIFF_ID 是否已設置
 * 2. 檢查是否有快取的用戶資料
 * 3. 初始化 LIFF SDK
 * 4. 檢查登入狀態，未登入則導向 LINE 登入頁面
 * 5. 取得用戶資料並快取
 * 
 * @returns {Promise<LineUserProfile>} 用戶資料
 * @throws {Error} 若 LIFF_ID 未設置、初始化失敗或正在跳轉登入頁面
 */
export async function ensureLineLogin(): Promise<LineUserProfile> {
  // 檢查 LIFF_ID 是否存在
  if (!LIFF_ID) {
    throw new Error("NEXT_PUBLIC_LIFF_ID 環境變數未設置！請檢查 .env.local 文件");
  }

  // 1. 檢查是否已有快取的 profile
  const cached = localStorage.getItem(KEY);
  if (cached) {
    try {
      const profile: LineUserProfile = JSON.parse(cached);
      return profile;
    } catch {
      // 如果解析失敗，清除快取，繼續後續流程
      localStorage.removeItem(KEY);
    }
  }

  // 2. 初始化 LIFF SDK
  if (!liff.isInClient()) {
    try {
      await liff.init({ liffId: LIFF_ID });
    } catch (error: any) {
      throw new Error(`LIFF 初始化失敗: ${error?.message || String(error)}`);
    }
  }

  // 3. 檢查登入狀態
  const isLoggedIn = liff.isLoggedIn();
  
  if (!isLoggedIn) {
    // 用戶尚未登入，跳轉到 LINE 登入頁面
    const redirectUri = window.location.href;
    liff.login({ redirectUri });
    
    // 這行之後的程式碼不會執行，因為頁面已經跳轉了
    throw new Error("Redirecting to LINE login...");
  }

  // 4. 已登入，取得用戶資料並快取
  const profile = await liff.getProfile();
  
  const userProfile: LineUserProfile = {
    userId: profile.userId,
    displayName: profile.displayName,
    pictureUrl: profile.pictureUrl,
    statusMessage: profile.statusMessage,
  };
  
  // 將用戶資料快取到 localStorage
  localStorage.setItem(KEY, JSON.stringify(userProfile));
  
  return userProfile;
}
