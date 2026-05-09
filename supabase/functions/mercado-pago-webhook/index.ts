import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });

const getSupabaseAdmin = () => {
  const url = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !serviceRoleKey) {
    throw new Error("Supabase service role envs are missing.");
  }

  return createClient(url, serviceRoleKey);
};

const normalizeOrderStatus = (paymentStatus: string) => {
  if (paymentStatus === "approved") return "paid";
  if (["rejected", "cancelled"].includes(paymentStatus)) return paymentStatus;
  return "pending";
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const accessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    if (!accessToken) {
      return jsonResponse({ error: "MERCADO_PAGO_ACCESS_TOKEN is missing" }, 500);
    }

    const body = await req.json().catch(() => ({}));
    const url = new URL(req.url);
    const paymentId =
      String(body?.data?.id ?? body?.id ?? url.searchParams.get("data.id") ?? url.searchParams.get("id") ?? "");

    if (!paymentId) {
      return jsonResponse({ received: true, ignored: "missing payment id" });
    }

    const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const paymentData = await paymentResponse.json();
    if (!paymentResponse.ok) {
      return jsonResponse({ error: "Unable to fetch Mercado Pago payment", details: paymentData }, 500);
    }

    const status = String(paymentData?.status ?? "pending");
    const orderId = String(paymentData?.external_reference ?? "");
    const supabase = getSupabaseAdmin();

    await supabase
      .from("payments")
      .update({ status })
      .eq("payment_id", paymentId);

    if (orderId) {
      const orderStatus = normalizeOrderStatus(status);
      await supabase
        .from("orders")
        .update({
          mercado_pago_id: paymentId,
          mercado_pago_status: status,
          payment_status: orderStatus === "paid" ? "paid" : status,
          status: orderStatus,
        })
        .eq("id", orderId);
    }

    return jsonResponse({ received: true, payment_id: paymentId, status, order_id: orderId });
  } catch (error) {
    return jsonResponse(
      {
        error: error instanceof Error ? error.message : "Unable to process webhook",
      },
      500,
    );
  }
});
