import { useQuery } from "@tanstack/react-query";
import type { Database } from "@/types/database.types";
import { supabase } from "@/lib/supabase";

/** Colunas reais de `public.products` usadas na coleção / personalizar (via `supabase gen types --linked`). */
type ProductRow = Database["public"]["Tables"]["products"]["Row"];

export type CatalogFields = Pick<
  ProductRow,
  "id" | "name" | "slug" | "price" | "category" | "description" | "image" | "created_at"
>;

export type CatalogProduct = {
  id: string;
  slug: string;
  name: string;
  category: string;
  price: number;
  description: string;
  image: string;
  created_at: string;
};

export type CatalogSection = {
  category: string;
  items: CatalogProduct[];
};

const CATALOG_COLUMNS = "id,name,slug,price,category,description,image,created_at" as const;

const parseMoney = (value: number | null) => {
  const n = typeof value === "number" ? value : NaN;
  return Number.isFinite(n) ? n : 0;
};

function mapRow(row: CatalogFields): CatalogProduct | null {
  const id = typeof row.id === "string" ? row.id : "";
  const slug = typeof row.slug === "string" ? row.slug : "";
  if (!id || !slug) return null;

  const image = typeof row.image === "string" ? row.image.trim() : "";

  return {
    id,
    slug,
    name: typeof row.name === "string" ? row.name : "",
    category: typeof row.category === "string" ? row.category.trim() : "",
    price: parseMoney(row.price),
    description: typeof row.description === "string" ? row.description : "",
    image,
    created_at: typeof row.created_at === "string" ? row.created_at : "",
  };
}

/** Mantém ordem global created_at DESC dentro de cada categoria; ordena seções pela data do produto mais novo da categoria. */
export function groupProductsByCategory(products: CatalogProduct[]): CatalogSection[] {
  const bucketOrder: string[] = [];
  const buckets = new Map<string, CatalogProduct[]>();

  for (const p of products) {
    const label = p.category.length ? p.category : "Outros";
    if (!buckets.has(label)) {
      buckets.set(label, []);
      bucketOrder.push(label);
    }
    buckets.get(label)!.push(p);
  }

  const sections = bucketOrder.map((category) => ({
    category,
    items: buckets.get(category)!,
  }));

  sections.sort((a, b) => {
    const ta = a.items[0]?.created_at ?? "";
    const tb = b.items[0]?.created_at ?? "";
    return tb.localeCompare(ta);
  });

  return sections;
}

async function fetchActiveCatalog(): Promise<CatalogSection[]> {
  const { data, error } = await supabase
    .from("products")
    .select(CATALOG_COLUMNS)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const rows =
    (data ?? [])
      .map((row) => mapRow(row as CatalogFields))
      .filter((r): r is CatalogProduct => Boolean(r)) ?? [];

  return groupProductsByCategory(rows);
}

export function useCatalogProducts() {
  return useQuery({
    queryKey: ["catalog", "products"],
    queryFn: fetchActiveCatalog,
    staleTime: 60_000,
  });
}
