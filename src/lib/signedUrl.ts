export async function getSignedUrls(paths: string[], expiresIn = 600) {
    const clean = paths.filter(Boolean);
  
    if (clean.length === 0) return new Map<string, string>();
  
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/get-signed-url`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "read",
          bucket: "Product_images",
          paths: clean,
          expiresIn,
        }),
      }
    );
  
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`get-signed-url failed: ${res.status} ${errText}`);
    }
  
    const json = await res.json();
  
    // json.results = [{filePath, signedUrl, error}]
    const map = new Map<string, string>();
    for (const r of json.results || []) {
      if (r?.filePath && r?.signedUrl && !r?.error) {
        map.set(r.filePath, r.signedUrl);
      }
    }
    return map;
  }