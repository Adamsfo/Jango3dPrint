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

  if (!url || !serviceRoleKey) return null;

  return createClient(url, serviceRoleKey);
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

    const body = await req.json();
    const orderId = String(body?.order_id ?? "");
    const amount = Number(body?.amount ?? 0);
    const paymentMethod = String(body?.payment_method ?? "pix").toLowerCase().trim();
    const customer = body?.customer ?? {};
    const items = Array.isArray(body?.items) ? body.items : [];

    if (!orderId || !Number.isFinite(amount) || amount <= 0) {
      return jsonResponse({ error: "Invalid payment payload" }, 400);
    }

    const payerName = String(customer?.name ?? "").trim();
    const nameParts = payerName.split(/\s+/).filter(Boolean);
    const [firstName, ...lastNameParts] = nameParts;
    const lastNameJoined = lastNameParts.join(" ");

    const basePayer = {
      email: String(customer?.email ?? ""),
      first_name: firstName || payerName || "Cliente",
      last_name: lastNameJoined,
      identification: customer?.cpf
        ? {
            type: "CPF",
            number: String(customer.cpf).replace(/\D/g, ""),
          }
        : undefined,
    };

    const basePaymentPayload = {
      transaction_amount: Number(amount.toFixed(2)),
      description: `Pedido JANGO3D #${orderId.slice(0, 8)}`,
      external_reference: orderId,
      notification_url: Deno.env.get("MERCADO_PAGO_WEBHOOK_URL") || undefined,
      payer: basePayer,
      additional_info: {
        items: items.map((item: any) => ({
          id: String(item.product_id ?? item.variant_id ?? item.name),
          title: String(item.name ?? "Produto JANGO3D"),
          quantity: Number(item.quantity ?? 1),
          unit_price: Number(item.final_price ?? 0),
        })),
      },
    };

    const paymentPayload =
      paymentMethod === "credit_card"
        ? {
            ...basePaymentPayload,
            token: body?.token,
            issuer_id: body?.issuer_id,
            payment_method_id: body?.payment_method_id,
            installments: Number(body?.installments ?? 1),
          }
        : {
            ...basePaymentPayload,
            payment_method_id: "pix",
          };

    const idempotencyKey = `${orderId}-${Date.now()}`;
    const paymentResponse = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify(paymentPayload),
    });

    const paymentText = await paymentResponse.text();
    let paymentData: unknown = paymentText;

    try {
      paymentData = paymentText ? JSON.parse(paymentText) : null;
    } catch {
      paymentData = paymentText;
    }

    if (!paymentResponse.ok) {
      return jsonResponse(
        {
          error: "Mercado Pago payment creation failed",
          status: paymentResponse.status,
          details: paymentData,
        },
        500,
      );
    }

    const pdata = paymentData as Record<string, unknown>;
    const paymentId = String(pdata?.id ?? "");
    const status = String(pdata?.status ?? "pending");
    const pointOfInteraction = pdata?.point_of_interaction as Record<string, unknown> | undefined;
    const transactionData = (pointOfInteraction?.transaction_data ?? {}) as Record<string, unknown>;

    const supabase = getSupabaseAdmin();
    if (supabase) {
      await supabase.from("payments").insert({
        order_id: orderId,
        payment_id: paymentId,
        payment_method: paymentMethod,
        status,
        amount,
      });

      await supabase
        .from("orders")
        .update({
          mercado_pago_id: paymentId,
          mercado_pago_status: status,
          payment_status: status === "approved" ? "paid" : "pending",
          status: status === "approved" ? "paid" : "pending",
        })
        .eq("id", orderId);
    }

    return jsonResponse({
      order_id: orderId,
      payment_id: paymentId,
      status,
      amount,
      payment_method: paymentMethod,
      qr_code: String(transactionData?.qr_code ?? ""),
      qr_code_base64: String(transactionData?.qr_code_base64 ?? ""),
    });
  } catch (error) {
    return jsonResponse(
      {
        error: error instanceof Error ? error.message : "Unable to create payment",
      },
      500,
    );
  }
});
