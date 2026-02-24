import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  const { paths } = await req.json();

  if (!Array.isArray(paths) || paths.length === 0) {
    return NextResponse.json({ signedUrls: {} });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const bucket = "Product_images";
  const expiresIn = 60 * 60; // 1 hour

  const unique = Array.from(new Set(paths.filter(Boolean).map((p) => String(p).replace(/^\/+/, ""))));

  const results = await Promise.all(
    unique.map(async (p) => {
      const { data, error } = await supabase.storage.from(bucket).createSignedUrl(p, expiresIn);
      return [p, error ? null : data.signedUrl] as const;
    })
  );

  const signedUrls: Record<string, string | null> = {};
  for (const [p, url] of results) signedUrls[p] = url;

  return NextResponse.json({ signedUrls });
}