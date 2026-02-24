import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  const { line_user_id, items } = await req.json();

  if (!line_user_id) {
    return NextResponse.json({ error: "Missing line_user_id" }, { status: 400 });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Empty cart" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .insert({ line_user_id })
    .select("id")
    .single();

  if (orderErr) return NextResponse.json({ error: orderErr.message }, { status: 400 });

  const payload = items.map((x: any) => ({
    order_id: order.id,
    product_id: x.product_id,
    qty: Math.max(1, Math.floor(Number(x.qty || 1))),
  }));

  const { error: itemsErr } = await supabase.from("order_items").insert(payload);
  if (itemsErr) return NextResponse.json({ error: itemsErr.message }, { status: 400 });

  return NextResponse.json({ ok: true, order_id: order.id });
}