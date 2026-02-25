"use client";

import { ensureLineLogin } from "@/lib/line";
import { getCart, updateQty, removeFromCart, clearCart, type CartItem } from "@/lib/cart";
import { useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

function fmt2(n: number) {
    return Number.isFinite(n) ? n.toFixed(2) : "0.00";
  }
export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitOrder = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);

    try {
      const profile = await ensureLineLogin();
      const items = getCart().map((x) => ({ product_id: x.product_id, qty: x.qty }));

      if (items.length === 0) {
        alert("購物車是空的");
        setSubmitting(false);
        return;
      }

      console.log("📤 送出訂單:", { 
        userId: profile.userId, 
        userName: profile.displayName, 
        items 
      });

      const res = await fetch("/api/orders/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          line_user_id: profile.userId, 
          name: profile.displayName,
          items 
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Submit failed");

      console.log("✅ 訂單成功:", json);
      clearCart();
      alert(`已送出訂單！ID: ${json.order_id}`);
      window.location.href = "/";
    } catch (e: any) {
      console.error("❌ Submit order error:", e);
      // 如果是 LINE 登入跳轉，設定標記
      if (e?.message?.includes("Redirecting to LINE login")) {
        console.log("🔄 設定 pending_order_submit 標記");
        sessionStorage.setItem("pending_order_submit", "true");
      } else {
        alert(e?.message ?? String(e));
        setSubmitting(false);
      }
    }
  }, [submitting]);

  useEffect(() => {
    const c = getCart();
    setCart(c);

    (async () => {
      try {
        if (c.length === 0) return;

        // 一次抓出購物車裡的商品資料（從 view）
        const ids = c.map((x) => x.product_id);

        const { data, error } = await supabase
          .from("v_products_2_public")
          .select("product_id, brand, model, description, original_price, selling_price_twd, outlet_price, cover_image_path, cost_twd")
          .in("product_id", ids);

        if (error) throw new Error(error.message);
        const list = data ?? [];
        console.log("cart products sample:", list[0]);

// 🔥 批次簽名圖片
const paths = list.map((p: any) => p.cover_image_path).filter(Boolean);

const res = await fetch("/api/sign-batch", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ paths }),
});

const json = await res.json();
const signedUrls = json?.signedUrls ?? {};

const withUrls = list.map((p: any) => ({
  ...p,
  cover_image_url: p.cover_image_path
    ? signedUrls[p.cover_image_path]
    : null,
}));

setProducts(withUrls);
      } catch (e: any) {
        setErr(e?.message ?? String(e));
      }
    })();
  }, []);

  // 🔥 新增：頁面載入時檢查是否需要送出訂單（從 LINE 登入回來）
  useEffect(() => {
    const shouldSubmit = sessionStorage.getItem("pending_order_submit");
    console.log("🔍 檢查 pending_order_submit:", shouldSubmit);
    
    if (shouldSubmit === "true") {
      console.log("✨ 偵測到從 LINE 登入回來，準備送出訂單...");
      sessionStorage.removeItem("pending_order_submit");
      // 延遲一下，確保購物車資料已載入
      setTimeout(() => {
        console.log("⏰ 執行延遲後的訂單送出");
        handleSubmitOrder();
      }, 1000);
    }
  }, [handleSubmitOrder]);

  const rows = useMemo(() => {
    const mapQty = new Map(cart.map((x) => [x.product_id, x.qty]));
    return products.map((p) => {
      const qty = mapQty.get(p.product_id) ?? 1;
      const price = Number(p.selling_price_twd ?? p.outlet_price ?? 0);
      return { ...p, qty, price, subtotal: price * qty };
    });
  }, [cart, products]);

  const total = useMemo(() => rows.reduce((s, r) => s + (Number(r.subtotal) || 0), 0), [rows]);
  const currency = rows[0]?.currency ?? "";

  if (err) {
    return (
      <div style={{ padding: 20 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Error</div>
        <pre style={{ whiteSpace: "pre-wrap" }}>{err}</pre>
      </div>
    );
  }

  return (
    <div style={{ padding: 20, maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>購物車</h2>
        <a 
          href="/" 
          style={{ 
            padding: "8px 16px",
            borderRadius: 8,
            border: "1px solid #ddd",
            textDecoration: "none",
            color: "#333",
            fontSize: 14
          }}
        >
          返回首頁
        </a>
      </div>

      {rows.length === 0 ? (
        <div>購物車是空的</div>
      ) : (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {rows.map((r) => (
              <div
                key={r.product_id}
                style={{
                  border: "1px solid #eee",
                  borderRadius: 12,
                  padding: 16,
                  background: "#fff",
                }}
              >
                {/* 上半部：圖片 + 基本資訊 */}
                <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                  {/* 圖片 */}
                  <div
                    style={{
                      width: 100,
                      height: 100,
                      minWidth: 100,
                      background: "#f5f5f5",
                      borderRadius: 10,
                      overflow: "hidden",
                    }}
                  >
                    {r.cover_image_url ? (
                      <img
                        src={r.cover_image_url}
                        alt={r.model ?? r.brand ?? "product"}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        onError={() => {
                          console.error("IMG load failed:", r.cover_image_url);
                        }}
                      />
                    ) : null}
                  </div>

                  {/* 品牌、型號、描述 */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* 品牌 */}
                    <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>
                      {r.brand ?? "-"}
                    </div>
                    
                    {/* 型號 */}
                    <div style={{ fontSize: 14, color: "#666", marginBottom: 6 }}>
                      {r.model ?? "-"}
                    </div>

                    {/* 描述 */}
                    {r.description && (
                      <div style={{ 
                        fontSize: 13, 
                        color: "#888", 
                        lineHeight: 1.4,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden"
                      }}>
                        {r.description}
                      </div>
                    )}
                  </div>
                </div>

                {/* 價格區域 */}
                <div style={{ 
                  padding: 12,
                  background: "#f9f9f9",
                  borderRadius: 8,
                  marginBottom: 12
                }}>
                  {r.original_price && (
                    <div style={{
                      fontSize: 13,
                      color: "#999",
                      textDecoration: "line-through",
                      marginBottom: 4
                    }}>
                      原價：{fmt2(Number(r.original_price))} USD
                    </div>
                  )}

                  <div style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: "#e74c3c",
                    marginBottom: 4
                  }}>
                    Outlet：{fmt2(Number(r.outlet_price ?? r.price))} USD
                  </div>

                  {r.cost_twd != null && (
                    <div style={{ 
                      fontSize: 13, 
                      color: "#666",
                      fontWeight: 600
                    }}>
                      約 {Math.round(Number(r.cost_twd)).toLocaleString("zh-TW")} 元
                    </div>
                  )}
                </div>

                {/* 數量控制 + 小計 */}
                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 12
                }}>
                  {/* 左側：數量控制 */}
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <span style={{ fontSize: 14, color: "#666" }}>數量</span>
                    <button
                      onClick={() => {
                        const next = updateQty(r.product_id, Math.max(1, r.qty - 1));
                        setCart(next);
                      }}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 6,
                        border: "1px solid #ddd",
                        background: "#fff",
                        cursor: "pointer",
                        fontSize: 16,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      -
                    </button>
                    <div style={{ 
                      minWidth: 32, 
                      textAlign: "center",
                      fontSize: 15,
                      fontWeight: 600
                    }}>
                      {r.qty}
                    </div>
                    <button
                      onClick={() => {
                        const next = updateQty(r.product_id, r.qty + 1);
                        setCart(next);
                      }}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 6,
                        border: "1px solid #ddd",
                        background: "#fff",
                        cursor: "pointer",
                        fontSize: 16,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      +
                    </button>
                  </div>

                  {/* 右側：小計 */}
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 12, color: "#888", marginBottom: 2 }}>
                      小計
                    </div>
                    <div style={{ fontSize: 11, color: "#999", marginBottom: 2 }}>
                      (Outlet 價格 x 1.5)
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#333" }}>
                      {Math.round(r.subtotal)} TWD
                    </div>
                  </div>
                </div>

                {/* 移除按鈕 */}
                <button
                  onClick={() => {
                    const next = removeFromCart(r.product_id);
                    setCart(next);
                    setProducts((prev) => prev.filter((p) => p.product_id !== r.product_id));
                  }}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: 8,
                    border: "1px solid #ddd",
                    background: "#fff",
                    color: "#e74c3c",
                    cursor: "pointer",
                    fontSize: 14,
                    fontWeight: 600
                  }}
                >
                  🗑️ 移除商品
                </button>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 18, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button
              onClick={() => {
                clearCart();
                setCart([]);
                setProducts([]);
              }}
            >
              清空購物車
            </button>

            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 12, opacity: 0.8 }}>總計</div>
              <div style={{ fontWeight: 900, fontSize: 18 }}>
                {Math.round(total)} TWD
              </div>
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <button
              onClick={handleSubmitOrder}
              disabled={submitting}
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 12,
                border: "1px solid #ddd",
                cursor: submitting ? "not-allowed" : "pointer",
                fontWeight: 800,
                opacity: submitting ? 0.6 : 1,
              }}
            >
              {submitting ? "處理中..." : "送出訂單（下一步）"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}