import type { CartItem } from "@/hooks/useCart";
import { calculateShipping as calculateMelhorEnvioShipping } from "@/services/melhorEnvio";
import { supabase } from "@/lib/supabase";

export type ShippingOption = {
  id: string;
  name: string;
  company: string;
  price: number;
  delivery_days: number;
  isFallback?: boolean;
};

type ProductDimensions = {
  id: string;
  weight: number;
  height: number;
  width: number;
  length: number;
};

type PreparedPackage = {
  id: string;
  width: number;
  height: number;
  length: number;
  weight: number;
  insurance_value: number;
  quantity: number;
};

const FALLBACK_SHIPPING: ShippingOption = {
  id: "fallback",
  name: "Frete padrão",
  company: "JANGO3D",
  price: 19.9,
  delivery_days: 6,
  isFallback: true,
};

const parseNumber = (value: unknown, fallback: number) => {
  const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : fallback;
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

export const getDeliveryEstimate = (productionDays: number, deliveryDays: number) =>
  Math.max(0, productionDays) + Math.max(0, deliveryDays);

export async function preparePackage(items: CartItem[]): Promise<PreparedPackage[]> {
  const productIds = Array.from(new Set(items.map((item) => item.product_id).filter(Boolean)));
  const { data, error } = await supabase
    .from("products")
    .select("id,weight,height,width,length")
    .in("id", productIds);

  if (error || !data?.length) {
    throw new Error("Não foi possível buscar dimensões dos produtos.");
  }

  const dimensionsByProduct = new Map<string, ProductDimensions>(
    data.map((row: any) => [
      row.id,
      {
        id: row.id,
        weight: parseNumber(row.weight, 0.3),
        height: parseNumber(row.height, 10),
        width: parseNumber(row.width, 15),
        length: parseNumber(row.length, 20),
      },
    ]),
  );

  return items.map((item) => {
    const dimensions = dimensionsByProduct.get(item.product_id);

    return {
      id: item.product_id,
      width: dimensions?.width ?? 15,
      height: dimensions?.height ?? 10,
      length: dimensions?.length ?? 20,
      weight: dimensions?.weight ?? 0.3,
      insurance_value: item.final_price,
      quantity: item.quantity,
    };
  });
}

export async function calculateShipping({
  items,
  destinationCep,
}: {
  items: CartItem[];
  destinationCep: string;
}): Promise<{ options: ShippingOption[]; usedFallback: boolean; message: string }> {
  const fallbackMessage = "Frete calculado automaticamente para sua região.";

  try {
    const products = await preparePackage(items);
    const options = await calculateMelhorEnvioShipping({ destinationCep, products });

    if (!options.length) {
      throw new Error("Nenhuma opção de frete disponível.");
    }

    return {
      options,
      usedFallback: false,
      message: fallbackMessage,
    };
  } catch {
    return {
      options: [FALLBACK_SHIPPING],
      usedFallback: true,
      message: fallbackMessage,
    };
  }
}
