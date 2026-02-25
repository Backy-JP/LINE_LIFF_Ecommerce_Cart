"use client";

import { useEffect, useState } from "react";
import { fetchProductsWithSignedUrls } from "@/lib/fetchProducts";
import { addToCart } from "@/lib/cart";

function fmt2(n: number) {
  return Number.isFinite(n) ? n.toFixed(2) : "0.00";
}

export default function HomePage() {
  const [items, setItems] = useState<any[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchProductsWithSignedUrls();
        console.log("商品資料:", data);
        setItems(data);
      } catch (e: any) {
        console.error("fetchProductsWithSignedUrls error:", e);
        setErr(e?.message ?? String(e));
      }
    })();
  }, []);

  if (err) {
    return (
      <div style={{ padding: 20 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Error</div>
        <pre style={{ whiteSpace: "pre-wrap" }}>{err}</pre>
      </div>
    );
  }

  return (
    <div style={{ padding: 20, maxWidth: 1200, margin: "0 auto" }}>
      {/* 頁首 */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 28 }}>Pei Shop</h1>
        <a 
          href="/cart" 
          style={{ 
            padding: "10px 20px",
            borderRadius: 8,
            border: "1px solid #ddd",
            textDecoration: "none",
            color: "#333",
            fontSize: 14,
            fontWeight: 600,
            background: "#fff",
            transition: "all 0.2s"
          }}
        >
          🛒 前往購物車
        </a>
      </div>

      {/* 商品網格 */}
      <div 
        style={{ 
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 20
        }}
      >
        {items.map((p) => (
          <div
            key={p.product_id}
            style={{
              border: "1px solid #eee",
              borderRadius: 12,
              overflow: "hidden",
              background: "#fff",
              transition: "box-shadow 0.2s",
              display: "flex",
              flexDirection: "column"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            {/* 圖片區域 */}
            <div
              style={{
                width: "100%",
                height: 280,
                background: "#f5f5f5",
                position: "relative",
                overflow: "hidden"
              }}
            >
              {p.cover_image_url ? (
                <img
                  src={p.cover_image_url}
                  alt={p.model ?? p.brand ?? "product"}
                  style={{ 
                    width: "100%", 
                    height: "100%", 
                    objectFit: "cover" 
                  }}
                  onError={(ev) => {
                    console.error("圖片載入失敗:", {
                      product_id: p.product_id,
                      cover_image_url: p.cover_image_url,
                    });
                    (ev.currentTarget as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#999",
                    fontSize: 14
                  }}
                >
                  無圖片
                </div>
              )}
            </div>

            {/* 商品資訊 */}
            <div style={{ padding: 16, flexGrow: 1, display: "flex", flexDirection: "column" }}>
              {/* 品牌 */}
              <div style={{ 
                fontWeight: 700, 
                fontSize: 16,
                marginBottom: 4,
                color: "#333"
              }}>
                {p.brand ?? "-"}
              </div>
              
              {/* 型號 */}
              <div style={{ 
                fontSize: 14,
                color: "#666",
                marginBottom: 12,
                lineHeight: 1.4
              }}>
                {p.model ?? "-"}
              </div>

              {/* 描述 */}
              {p.description && (
                <div style={{ 
                  fontSize: 13, 
                  color: "#888",
                  lineHeight: 1.5,
                  marginBottom: 12,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden"
                }}>
                  {p.description}
                </div>
              )}

              {/* 價格區域 */}
              <div style={{ marginTop: "auto", marginBottom: 12 }}>
                {p.original_price && (
                  <div
                    style={{
                      fontSize: 13,
                      color: "#999",
                      textDecoration: "line-through",
                      marginBottom: 4
                    }}
                  >
                    原價 {fmt2(Number(p.original_price))} USD
                  </div>
                )}

                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    color: "#e74c3c",
                    marginBottom: 2
                  }}
                >
                  Outlet 價格：{fmt2(Number(p.outlet_price ?? p.selling_price_twd ?? 0))} USD
                </div>

                {p.cost_twd != null && (
                  <div style={{ 
                    fontSize: 13, 
                    color: "#666",
                    fontWeight: 600
                  }}>
                    約 {Math.round(Number(p.cost_twd)).toLocaleString("zh-TW")} 元
                  </div>
                )}
              </div>

              {/* 加入購物車按鈕 */}
              <button
                onClick={() => {
                  addToCart(p.product_id, 1);
                  alert("✅ 已加入購物車");
                }}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: 8,
                  border: "none",
                  background: "#3498db",
                  color: "#fff",
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "background 0.2s"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#2980b9";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#3498db";
                }}
              >
                加入購物車
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 空狀態 */}
      {items.length === 0 && !err && (
        <div style={{ 
          textAlign: "center", 
          padding: 60,
          color: "#999",
          fontSize: 16
        }}>
          載入中...
        </div>
      )}
    </div>
  );
}