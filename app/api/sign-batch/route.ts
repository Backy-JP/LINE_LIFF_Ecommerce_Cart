import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs"; // 確保用 Node runtime

export async function POST(req: Request) {
  try {
    // 1) 解析 body（如果 body 不是 JSON，這裡會丟錯）
    const body = await req.json().catch(() => null);

    const pathsRaw = body?.paths;

    if (!Array.isArray(pathsRaw) || pathsRaw.length === 0) {
      return NextResponse.json({ signedUrls: {}, reason: "paths is empty or not an array" });
    }

    // 2) 檢查環境變數（缺任何一個都直接回傳原因，不要 500 黑箱）
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url) {
      return NextResponse.json({ error: "Missing env: NEXT_PUBLIC_SUPABASE_URL" }, { status: 500 });
    }
    if (!service) {
      return NextResponse.json({ error: "Missing env: SUPABASE_SERVICE_ROLE_KEY" }, { status: 500 });
    }

    const supabase = createClient(url, service);

    const bucket = "Product_images";
    const expiresIn = 60 * 60; // 1 hour

    // 3) 清理 paths：去掉空值、轉字串、去掉開頭斜線
    const unique = Array.from(
      new Set(
        pathsRaw
          .filter(Boolean)
          .map((p: any) => String(p).trim().replace(/^\/+/, ""))
          .filter((p: string) => p.length > 0)
      )
    );

    // 4) 逐筆簽名；若某筆失敗也回報 error（方便找 bucket/path 拼錯）
    const results = await Promise.all(
      unique.map(async (p) => {
        const { data, error } = await supabase.storage.from(bucket).createSignedUrl(p, expiresIn);
        return [p, error ? { url: null, error: error.message } : { url: data.signedUrl, error: null }] as const;
      })
    );

    const signedUrls: Record<string, string | null> = {};
    const errors: Record<string, string | null> = {};

    for (const [p, r] of results) {
      signedUrls[p] = r.url;
      errors[p] = r.error;
    }

    return NextResponse.json({ bucket, expiresIn, signedUrls, errors });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || String(e), hint: "Request body must be JSON like { paths: [...] }" },
      { status: 500 }
    );
  }
}