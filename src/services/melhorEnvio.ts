import type { ShippingOption } from "@/services/shipping";
import { supabase } from "@/lib/supabase";

type MelhorEnvioProduct = {
  id: string;
  width: number;
  height: number;
  length: number;
  weight: number;
  insurance_value: number;
  quantity: number;
};

const parseNumber = (value: unknown, fallback: number) => {
  const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : fallback;
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

export async function calculateShipping({
  destinationCep,
  products,
}: {
  destinationCep: string;
  products: MelhorEnvioProduct[];
}): Promise<ShippingOption[]> {
  const { data, error } = await supabase.functions.invoke("calculate-shipping", {
    body: {
      destinationCep,
      products,
    },
  });

  if (error) {
    throw error;
  }

  if (!Array.isArray(data)) {
    return [];
  }

  return data
    .map((service: any) => ({
      id: String(service.id ?? `${service.company}-${service.name}`),
      name: String(service.name ?? "Frete"),
      company: String(service.company ?? "Transportadora"),
      price: parseNumber(service.price, 0),
      delivery_days: parseNumber(service.delivery_time ?? service.delivery_days, 0),
    }))
    .filter((option) => option.price > 0);
}
