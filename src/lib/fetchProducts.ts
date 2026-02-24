import { supabase } from "./supabase";

async function signPath(path: string) {
  const res = await fetch("/api/sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path }),
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json?.error ?? "Sign failed");
  return json.signedUrl as string;
}

export async function fetchProductsWithSignedUrls() {
  const { data: rows, error } = await supabase
    .from("v_products_2_public")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`DB error: ${error.message}`);

  const products = await Promise.all(
    (rows ?? []).map(async (p: any) => {
      if (!p.cover_image_path) return { ...p, cover_image_url: null };

      try {
        const signedUrl = await signPath(p.cover_image_path);
        return { ...p, cover_image_url: signedUrl };
      } catch (e: any) {
        return { ...p, cover_image_url: null, sign_error: e?.message ?? String(e) };
      }
    })
  );

  return products;
}