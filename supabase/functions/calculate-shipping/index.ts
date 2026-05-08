const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type ShippingProduct = {
  id: string;
  width: number;
  height: number;
  length: number;
  weight: number;
  insurance_value: number;
  quantity: number;
};

const getMelhorEnvioEnvironment = () => {
  const raw = Deno.env.get("MELHOR_ENVIO_ENVIRONMENT") ?? Deno.env.get("MELHOR_ENVIO_ENV") ?? "production";
  return raw.toLowerCase() === "sandbox" ? "sandbox" : "production";
};

const getMelhorEnvioBaseUrl = () =>
  getMelhorEnvioEnvironment() === "sandbox"
    ? "https://sandbox.melhorenvio.com.br"
    : "https://www.melhorenvio.com.br";

const getMelhorEnvioApiUrl = () => `${getMelhorEnvioBaseUrl()}/api/v2/me/shipment/calculate`;
const getMelhorEnvioTokenUrl = () => `${getMelhorEnvioBaseUrl()}/oauth/token`;

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });

const parseNumber = (value: unknown, fallback: number) => {
  const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : fallback;
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

const maskSecret = (value?: string | null) => {
  if (!value) return "missing";
  if (value.length <= 6) return `${value.slice(0, 2)}***`;
  return `${value.slice(0, 4)}***${value.slice(-2)}`;
};

async function getToken() {
  const clientId = Deno.env.get("MELHOR_ENVIO_CLIENT_ID");
  const clientSecret = Deno.env.get("MELHOR_ENVIO_CLIENT_SECRET");
  const environment = getMelhorEnvioEnvironment();
  const tokenUrl = getMelhorEnvioTokenUrl();

  const tokenBody = {
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
    scope: "shipping-calculate shipping-generate shipping-cancel shipping-tracking",
  };

  console.log("[calculate-shipping] Melhor Envio environment:", environment);
  console.log("[calculate-shipping] OAuth endpoint:", tokenUrl);
  console.log("[calculate-shipping] client_id received:", clientId ?? "missing");
  console.log("[calculate-shipping] client_secret exists:", Boolean(clientSecret));
  console.log("[calculate-shipping] client_secret masked:", maskSecret(clientSecret));
  console.log("[calculate-shipping] OAuth request body:", {
    ...tokenBody,
    client_secret: maskSecret(clientSecret),
  });

  if (!clientId || !clientSecret) {
    throw {
      message: "Melhor Envio credentials are missing.",
      status: 500,
      details: {
        environment,
        tokenUrl,
        hasClientId: Boolean(clientId),
        hasClientSecret: Boolean(clientSecret),
        clientId: clientId ?? null,
        clientSecretMasked: maskSecret(clientSecret),
      },
    };
  }

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(tokenBody),
  });

  const responseText = await response.text();
  let responseBody: unknown = responseText;

  try {
    responseBody = responseText ? JSON.parse(responseText) : null;
  } catch {
    responseBody = responseText;
  }

  console.log("[calculate-shipping] OAuth status code:", response.status);
  console.log("[calculate-shipping] OAuth full response:", responseBody);
  console.log(
    "[calculate-shipping] OAuth returned scopes:",
    typeof responseBody === "object" && responseBody && "scope" in responseBody
      ? (responseBody as any).scope
      : "not returned",
  );

  if (!response.ok) {
    console.error("[calculate-shipping] OAuth error body:", responseBody);
    throw {
      message: "Unable to authenticate with Melhor Envio.",
      status: response.status,
      details: {
        environment,
        tokenUrl,
        requestBody: {
          ...tokenBody,
          client_secret: maskSecret(clientSecret),
        },
        responseBody,
      },
    };
  }

  const data = responseBody;
  const token = typeof data?.access_token === "string" ? data.access_token : "";

  if (!token) {
    throw {
      message: "Melhor Envio token was not returned.",
      status: 500,
      details: {
        environment,
        tokenUrl,
        responseBody,
      },
    };
  }

  return token;
}

async function calculateShipping({
  destinationCep,
  products,
}: {
  destinationCep: string;
  products: ShippingProduct[];
}) {
  const originCep = Deno.env.get("MELHOR_ENVIO_CEP_ORIGEM");

  if (!originCep) {
    throw new Error("Origin CEP is missing.");
  }

  const apiUrl = getMelhorEnvioApiUrl();
  console.log("[calculate-shipping] Shipment endpoint:", apiUrl);

  const token = await getToken();
  const payload = {
    from: {
      postal_code: originCep,
    },
    to: {
      postal_code: destinationCep,
    },
    products: products.map((product) => ({
      id: product.id,
      width: Number(product.width) || 15,
      height: Number(product.height) || 15,
      length: Number(product.length) || 15,
      weight: Number(product.weight) || 0.3,
      insurance_value: Number((product as any).price ?? product.insurance_value) || 100,
      quantity: Number(product.quantity) || 1,
    })),
  };

  console.log("Payload enviado:", payload);

  const shippingResponse = await fetch(apiUrl, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "User-Agent": "Aplicação JANGO3D",
    },
    body: JSON.stringify(payload),
  });

  const responseText = await shippingResponse.text();
  let responseData: unknown = responseText;

  try {
    responseData = responseText ? JSON.parse(responseText) : null;
  } catch {
    responseData = responseText;
  }

  console.log("Status Melhor Envio:", shippingResponse.status);
  console.log("Resposta Melhor Envio:", responseData);

  if (!shippingResponse.ok) {
    console.error("[calculate-shipping] Shipping error status:", shippingResponse.status);
    console.error("[calculate-shipping] Shipping error body:", responseData);
    return new Response(
      JSON.stringify({
        status: shippingResponse.status,
        error: responseData,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  }

  const result = responseData;

  if (!Array.isArray(result)) {
    return [];
  }

  return result
    .filter((service: any) => !service.error && service.price)
    .map((service: any) => ({
      company: String(service.company?.name ?? service.company ?? "Transportadora"),
      name: String(service.name ?? "Frete"),
      price: parseNumber(service.price, 0),
      delivery_time: parseNumber(service.delivery_time ?? service.delivery_days, 0),
    }))
    .filter((option) => option.price > 0);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const body = await req.json();
    const destinationCep = String(body?.destinationCep ?? body?.cep ?? "").replace(/\D/g, "");
    const products = Array.isArray(body?.products) ? body.products : [];

    if (destinationCep.length !== 8) {
      return jsonResponse({ error: "Invalid destination CEP" }, 400);
    }

    if (!products.length) {
      return jsonResponse({ error: "Products are required" }, 400);
    }

    const options = await calculateShipping({ destinationCep, products });
    if (options instanceof Response) return options;

    return jsonResponse(options);
  } catch (error) {
    console.error("[calculate-shipping] Function error:", error);
    const status = typeof error === "object" && error && "status" in error ? Number((error as any).status) : 500;
    return jsonResponse(
      {
        error:
          error instanceof Error
            ? error.message
            : typeof error === "object" && error && "message" in error
              ? String((error as any).message)
              : "Unable to calculate shipping",
        details: typeof error === "object" && error && "details" in error ? (error as any).details : undefined,
      },
      Number.isFinite(status) ? status : 500,
    );
  }
});
