"use client";

export default function TestEnvPage() {
  return (
    <div style={{ padding: 20, fontFamily: "monospace" }}>
      <h1>環境變數測試</h1>
      <div style={{ marginTop: 20 }}>
        <h3>NEXT_PUBLIC_LIFF_ID:</h3>
        <pre style={{ 
          background: "#f5f5f5", 
          padding: 10, 
          borderRadius: 5,
          color: process.env.NEXT_PUBLIC_LIFF_ID ? "green" : "red"
        }}>
          {process.env.NEXT_PUBLIC_LIFF_ID || "❌ 未設置"}
        </pre>
      </div>

      <div style={{ marginTop: 20 }}>
        <h3>NEXT_PUBLIC_SUPABASE_URL:</h3>
        <pre style={{ 
          background: "#f5f5f5", 
          padding: 10, 
          borderRadius: 5,
          color: process.env.NEXT_PUBLIC_SUPABASE_URL ? "green" : "red"
        }}>
          {process.env.NEXT_PUBLIC_SUPABASE_URL || "❌ 未設置"}
        </pre>
      </div>

      <div style={{ marginTop: 20 }}>
        <h3>NEXT_PUBLIC_SUPABASE_ANON_KEY:</h3>
        <pre style={{ 
          background: "#f5f5f5", 
          padding: 10, 
          borderRadius: 5,
          color: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "green" : "red"
        }}>
          {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY 
            ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.slice(0, 20) + "..." 
            : "❌ 未設置"}
        </pre>
      </div>

      <div style={{ marginTop: 30, padding: 15, background: "#fffbe6", borderRadius: 5 }}>
        <strong>⚠️ 如果顯示「未設置」：</strong>
        <ol style={{ marginTop: 10, lineHeight: 1.8 }}>
          <li>確認 <code>.env.local</code> 文件存在於專案根目錄</li>
          <li>確認環境變數名稱正確（必須以 <code>NEXT_PUBLIC_</code> 開頭）</li>
          <li><strong>重啟開發伺服器</strong>（Ctrl+C 停止，然後重新執行 <code>npm run dev</code>）</li>
        </ol>
      </div>
    </div>
  );
}
