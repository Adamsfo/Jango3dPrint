import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronLeft,
  HeartHandshake,
  MessageCircle,
  PackageCheck,
  Play,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
  Wand2,
} from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/produto/$slug")({
  head: () => ({
    meta: [
      { title: "Produto - JANGO3D" },
      {
        name: "description",
        content: "Configure sua luminária personalizada JANGO3D com acabamento premium.",
      },
    ],
  }),
  component: ProductPage,
});

type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  image: string;
  video_url?: string;
  category: string;
  price: number;
  stock: number;
  production_days: number;
  extra_personalization_days: number;
  customizable: boolean;
  personalization_label: string;
  max_characters: number;
  customization_price: number;
};

type ProductVariant = {
  product_id: string;
  color: string;
  size: string;
  image: string;
  gallery: string[];
  video_url?: string;
  price: number;
  stock: number;
};

type MediaItem = {
  id: string;
  type: "image" | "video";
  src: string;
  label: string;
};

const parseMoney = (value: unknown) => {
  const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : 0;
  return Number.isFinite(n) ? n : 0;
};

const parseNumber = (value: unknown, fallback = 0) => {
  const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : fallback;
  return Number.isFinite(n) ? n : fallback;
};

const formatBRL = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const isDirectVideo = (url: string) => /\.(mp4|webm|ogg)(\?.*)?$/i.test(url);

const unique = (items: string[]) => Array.from(new Set(items.filter(Boolean)));

const parseGallery = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];

  return value.filter((item): item is string => typeof item === "string" && item.length > 0);
};

const mapProduct = (row: any): Product => ({
  id: typeof row?.id === "string" ? row.id : "",
  slug: typeof row?.slug === "string" ? row.slug : "",
  name: typeof row?.name === "string" ? row.name : "",
  description: typeof row?.description === "string" ? row.description : "",
  image: typeof row?.image === "string" ? row.image : "",
  video_url: typeof row?.video_url === "string" && row.video_url.length > 0 ? row.video_url : undefined,
  category: typeof row?.category === "string" && row.category.length > 0 ? row.category : "Luminária personalizada",
  price: parseMoney(row?.price),
  stock: parseNumber(row?.stock, 0),
  production_days: parseNumber(row?.production_days, 3),
  extra_personalization_days: parseNumber(row?.extra_personalization_days, 0),
  customizable: Boolean(row?.customizable),
  personalization_label:
    typeof row?.personalization_label === "string" && row.personalization_label.length > 0
      ? row.personalization_label
      : typeof row?.customization_label === "string" && row.customization_label.length > 0
        ? row.customization_label
        : "Nome na luminária",
  max_characters: parseNumber(row?.max_characters ?? row?.customization_max_chars, 14),
  customization_price: parseMoney(row?.customization_price),
});

const mapVariant = (row: any): ProductVariant => ({
  product_id: typeof row?.product_id === "string" ? row.product_id : "",
  color: typeof row?.color === "string" && row.color.length > 0 ? row.color : "Padrão",
  size: typeof row?.size === "string" && row.size.length > 0 ? row.size : "Único",
  image: typeof row?.image === "string" ? row.image : "",
  gallery: parseGallery(row?.gallery),
  video_url: typeof row?.video_url === "string" && row.video_url.length > 0 ? row.video_url : undefined,
  price: parseMoney(row?.price),
  stock: parseNumber(row?.stock, 0),
});

function ProductPage() {
  const { slug } = Route.useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [personalization, setPersonalization] = useState("");
  const [activeMediaId, setActiveMediaId] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function run() {
      setIsLoading(true);

      const { data: productData, error: productError } = await supabase
        .from("products")
        .select("*")
        .eq("slug", slug)
        .single();

      if (!isMounted) return;

      if (productError || !productData) {
        setProduct(null);
        setVariants([]);
        setIsLoading(false);
        return;
      }

      const mappedProduct = mapProduct(productData);
      const variantResult = await supabase
        .from("product_variants")
        .select("product_id,color,size,image,gallery,video_url,price,stock")
        .eq("product_id", mappedProduct.id)
        .order("price", { ascending: true });

      const fallbackVariantResult = variantResult.error
        ? await supabase
            .from("product_variants")
            .select("product_id,color,size,image,price,stock")
            .eq("product_id", mappedProduct.id)
            .order("price", { ascending: true })
        : null;

      if (!isMounted) return;

      const variantData = variantResult.data ?? fallbackVariantResult?.data ?? [];
      const mappedVariants =
        variantData
          ?.map(mapVariant)
          .filter((variant) => Boolean(variant.product_id))
          .sort((a, b) => a.price - b.price) ?? [];
      const cheapestVariant = mappedVariants[0];

      setProduct(mappedProduct);
      setVariants(mappedVariants);
      setSelectedColor(cheapestVariant?.color ?? "");
      setSelectedSize(cheapestVariant?.size ?? "");
      setActiveMediaId("");
      setIsLoading(false);
    }

    void run();
    return () => {
      isMounted = false;
    };
  }, [slug]);

  const colors = useMemo(() => unique(variants.map((variant) => variant.color)), [variants]);
  const sizes = useMemo(
    () =>
      unique(
        variants
          .filter((variant) => !selectedColor || variant.color === selectedColor)
          .map((variant) => variant.size),
      ),
    [selectedColor, variants],
  );

  useEffect(() => {
    if (sizes.length && !sizes.includes(selectedSize)) {
      setSelectedSize(sizes[0]);
    }
  }, [selectedSize, sizes]);

  const selectedVariant = useMemo(() => {
    if (!variants.length) return null;

    return (
      variants.find((variant) => variant.color === selectedColor && variant.size === selectedSize) ??
      variants.find((variant) => variant.color === selectedColor) ??
      variants[0]
    );
  }, [selectedColor, selectedSize, variants]);

  const mediaItems = useMemo<MediaItem[]>(() => {
    if (!product) return [];

    const media: MediaItem[] = [];
    const variantKey = selectedVariant
      ? `${selectedVariant.color}-${selectedVariant.size}`
      : "variant";

    selectedVariant?.gallery.forEach((src, index) => {
      if (media.some((item) => item.src === src)) return;
      media.push({
        id: `${variantKey}-gallery-${index}`,
        type: "image",
        src,
        label: `${selectedVariant.color} - ${selectedVariant.size} - imagem ${index + 1}`,
      });
    });

    if (selectedVariant?.image && !media.some((item) => item.src === selectedVariant.image)) {
      media.push({
        id: `${variantKey}-image`,
        type: "image",
        src: selectedVariant.image,
        label: `${selectedVariant.color} - ${selectedVariant.size}`,
      });
    }

    if (selectedVariant?.video_url) {
      media.push({
        id: `${variantKey}-video`,
        type: "video",
        src: selectedVariant.video_url,
        label: `${selectedVariant.color} - ${selectedVariant.size} - vídeo`,
      });
    }

    if (!media.length && product.image) {
      media.push({ id: "product-image-fallback", type: "image", src: product.image, label: "Imagem principal" });
    }

    return media;
  }, [product, selectedVariant]);

  useEffect(() => {
    if (!mediaItems.length) {
      setActiveMediaId("");
      return;
    }

    setActiveMediaId(mediaItems[0].id);
  }, [mediaItems]);

  const activeMedia = mediaItems.find((item) => item.id === activeMediaId) ?? mediaItems[0];
  const basePrice = selectedVariant?.price ?? product?.price ?? 0;
  const customizationPrice =
    product?.customizable && personalization.trim().length > 0
      ? Number(product.customization_price || 0)
      : 0;
  const finalPrice = basePrice + customizationPrice;
  const stock = selectedVariant?.stock ?? product?.stock ?? 0;
  const hasPersonalization = Boolean(product?.customizable && personalization.trim());
  const totalProductionDays =
    (product?.production_days ?? 0) + (hasPersonalization ? product?.extra_personalization_days ?? 0 : 0);
  const whatsappMessage = encodeURIComponent(
    `Olá! Quero comprar ${product?.name ?? "uma luminária JANGO3D"}.\nCor: ${selectedColor || "Padrão"}\nTamanho: ${
      selectedSize || "Único"
    }\nPersonalização: ${personalization.trim() || "Sem personalização"}\nTotal: ${formatBRL(finalPrice)}`,
  );

  const selectColor = (color: string) => {
    setSelectedColor(color);
    const cheapestForColor = variants.filter((variant) => variant.color === color)[0];
    setSelectedSize(cheapestForColor?.size ?? "");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <ProductSkeleton />
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen">
        <Header />
        <section className="mx-auto grid min-h-[60vh] max-w-7xl place-items-center px-6 py-24 text-center">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Produto indisponível</p>
            <h1 className="mt-4 font-display text-4xl">Produto não encontrado.</h1>
            <Link
              to="/colecao"
              className="mt-8 inline-flex rounded-full border border-border/70 px-6 py-3 text-sm text-muted-foreground cinematic hover:-translate-y-0.5 hover:text-foreground"
            >
              Voltar para coleção
            </Link>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_45%_at_24%_10%,rgba(255,190,80,.12)_0%,transparent_62%),radial-gradient(45%_40%_at_80%_30%,rgba(255,145,45,.08)_0%,transparent_68%)]" />
        <div className="mx-auto max-w-7xl px-6 py-10 md:py-16">
          <Link
            to="/colecao"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-muted-foreground cinematic hover:-translate-y-0.5 hover:text-[#ffbf5e]"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Coleção
          </Link>

          <div className="mt-8 grid gap-10 lg:grid-cols-[1.08fr_.92fr] lg:items-start">
            <ProductGallery
              productName={product.name}
              mediaItems={mediaItems}
              activeMedia={activeMedia}
              onSelect={setActiveMediaId}
            />

            <aside className="relative rounded-[2rem] p-6 shadow-soft glass md:p-8">
              <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,190,80,.9),transparent)]" />
              <p className="text-xs uppercase tracking-[0.28em] text-primary/85">{product.category}</p>
              <h1 className="mt-4 font-display text-4xl leading-tight text-balance md:text-5xl">
                {product.name}
              </h1>
              <p className="mt-5 text-pretty leading-relaxed text-muted-foreground">
                {product.description}
              </p>

              <div className="mt-8 grid gap-4 rounded-3xl border border-border/70 bg-background/35 p-5 backdrop-blur">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Preço</p>
                  <p className="mt-1 font-display text-4xl text-foreground">{formatBRL(finalPrice)}</p>
                  {customizationPrice > 0 ? (
                    <div className="mt-4 max-w-sm rounded-2xl border border-border/60 bg-card/25 p-4 text-sm">
                      <div className="flex items-center justify-between gap-4 text-muted-foreground">
                        <span>Produto</span>
                        <span>{formatBRL(basePrice)}</span>
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-4 text-primary">
                        <span>+ Personalização</span>
                        <span>{formatBRL(customizationPrice)}</span>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-4 border-t border-border/60 pt-3 text-foreground">
                        <span>Total</span>
                        <span className="font-medium">{formatBRL(finalPrice)}</span>
                      </div>
                    </div>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-3 text-sm">
                  <Badge tone={stock > 0 ? "success" : "muted"}>
                    {stock > 0 ? `${stock} em estoque` : "Indisponível no momento"}
                  </Badge>
                  <Badge>Produção: {totalProductionDays} dias úteis</Badge>
                </div>
              </div>

              <div className="mt-8 space-y-7">
                {colors.length ? (
                  <OptionGroup title={`Cor${selectedColor ? ` - ${selectedColor}` : ""}`}>
                    {colors.map((color) => (
                      <ChoiceButton
                        key={color}
                        active={selectedColor === color}
                        onClick={() => selectColor(color)}
                      >
                        {color}
                      </ChoiceButton>
                    ))}
                  </OptionGroup>
                ) : null}

                {sizes.length ? (
                  <OptionGroup title={`Tamanho${selectedSize ? ` - ${selectedSize}` : ""}`}>
                    {sizes.map((size) => (
                      <ChoiceButton
                        key={size}
                        active={selectedSize === size}
                        onClick={() => setSelectedSize(size)}
                      >
                        {size}
                      </ChoiceButton>
                    ))}
                  </OptionGroup>
                ) : null}

                {product.customizable ? (
                  <div>
                    <Label>{product.personalization_label}</Label>
                    <input
                      value={personalization}
                      onChange={(event) =>
                        setPersonalization(event.target.value.slice(0, product.max_characters))
                      }
                      maxLength={product.max_characters}
                      placeholder="Digite aqui"
                      className="mt-3 w-full rounded-full border border-border/80 bg-background/55 px-5 py-3.5 text-sm outline-none transition-all duration-300 placeholder:text-muted-foreground/65 focus:border-primary/70 focus:shadow-[0_0_28px_rgba(255,190,80,.12)]"
                    />
                    <div className="mt-2 flex items-center justify-between gap-4 text-xs text-muted-foreground">
                      <span>Máximo de {product.max_characters} caracteres</span>
                      <span>{personalization.length}/{product.max_characters} caracteres</span>
                    </div>
                  </div>
                ) : null}

                <div className="rounded-3xl border border-primary/20 bg-primary/8 p-5">
                  <p className="text-xs uppercase tracking-[0.24em] text-primary/85">
                    Produção estimada
                  </p>
                  <p className="mt-2 font-display text-2xl">{totalProductionDays} dias úteis</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Inclui produção base de {product.production_days} dias
                    {hasPersonalization
                      ? ` + ${product.extra_personalization_days} dias para personalização.`
                      : "."}
                  </p>
                </div>
              </div>

              <div className="mt-8 grid gap-3">
                <button className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-4 text-sm font-medium text-primary-foreground shadow-glow cinematic hover:-translate-y-0.5 hover:bg-primary/90">
                  <ShoppingBag className="h-4 w-4" /> Comprar agora
                </button>
                <button className="inline-flex items-center justify-center gap-2 rounded-full border border-border/80 bg-card/35 px-6 py-4 text-sm font-medium cinematic hover:-translate-y-0.5 hover:bg-card/60">
                  <PackageCheck className="h-4 w-4" /> Adicionar ao carrinho
                </button>
                <a
                  href={`https://wa.me/?text=${whatsappMessage}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-primary/35 bg-primary/10 px-6 py-4 text-sm font-medium text-primary cinematic hover:-translate-y-0.5 hover:bg-primary/15"
                >
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </a>
              </div>

              <ul className="mt-7 grid gap-3 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" /> Configuração feita com variantes reais do produto
                </li>
                <li className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-primary" /> Envio rastreado para todo o Brasil
                </li>
                <li className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" /> Acabamento revisado manualmente
                </li>
              </ul>
            </aside>
          </div>
        </div>
      </section>

      <ProductInfoSections />

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border/70 bg-background/85 px-4 py-3 backdrop-blur-xl md:hidden">
        <div className="mx-auto flex max-w-md items-center justify-between gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="font-display text-xl">{formatBRL(finalPrice)}</p>
          </div>
          <button className="rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-glow">
            Comprar
          </button>
        </div>
      </div>

      <Footer />
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">{children}</p>;
}

function OptionGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <Label>{title}</Label>
      <div className="mt-3 flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function ChoiceButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-4 py-2.5 text-sm transition-all duration-300 ${
        active
          ? "border-primary/70 bg-primary text-primary-foreground shadow-glow"
          : "border-border/80 bg-background/45 text-muted-foreground hover:-translate-y-0.5 hover:border-primary/40 hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function Badge({ children, tone = "muted" }: { children: React.ReactNode; tone?: "success" | "muted" }) {
  return (
    <span
      className={`rounded-full border px-3 py-1.5 text-xs ${
        tone === "success"
          ? "border-primary/35 bg-primary/10 text-primary"
          : "border-border/70 bg-card/35 text-muted-foreground"
      }`}
    >
      {children}
    </span>
  );
}

function ProductGallery({
  productName,
  mediaItems,
  activeMedia,
  onSelect,
}: {
  productName: string;
  mediaItems: MediaItem[];
  activeMedia?: MediaItem;
  onSelect: (id: string) => void;
}) {
  const fallback = activeMedia ?? mediaItems[0];

  if (!fallback) {
    return <div className="aspect-square rounded-[2rem] shimmer" />;
  }

  return (
    <div className="lg:sticky lg:top-32">
      <div className="relative overflow-hidden rounded-[2.25rem] border border-border/70 bg-card/35 shadow-soft glass">
        <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(65%_50%_at_50%_65%,rgba(255,190,80,.14)_0%,transparent_68%)]" />
        {fallback.type === "video" && isDirectVideo(fallback.src) ? (
          <video
            key={fallback.src}
            src={fallback.src}
            className="aspect-square w-full object-cover"
            autoPlay
            muted
            playsInline
            preload="auto"
            onEnded={() => {
              const firstImage = mediaItems.find((item) => item.type === "image");
              if (firstImage) onSelect(firstImage.id);
            }}
          />
        ) : fallback.type === "video" ? (
          <iframe
            key={fallback.src}
            src={fallback.src}
            title={`${productName} em vídeo`}
            className="aspect-square w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <img
            src={fallback.src}
            alt={productName}
            className="aspect-square w-full object-cover transition-transform duration-700 hover:scale-[1.035]"
            loading="eager"
          />
        )}
      </div>

      {mediaItems.length > 1 ? (
        <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
          {mediaItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border transition-all duration-300 md:h-24 md:w-24 ${
                fallback.id === item.id
                  ? "border-primary/80 shadow-glow"
                  : "border-border/70 opacity-70 hover:-translate-y-0.5 hover:opacity-100"
              }`}
              aria-label={item.label}
            >
              {item.type === "video" ? (
                <div className="grid h-full w-full place-items-center bg-card">
                  <Play className="h-5 w-5 fill-primary text-primary" />
                </div>
              ) : (
                <img src={item.src} alt="" className="h-full w-full object-cover" loading="lazy" />
              )}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ProductInfoSections() {
  const sections = [
    {
      icon: Sparkles,
      title: "Detalhes do produto",
      text: "Peça decorativa criada para unir presença visual, luz acolhedora e personalização elegante.",
    },
    {
      icon: HeartHandshake,
      title: "Produção artesanal",
      text: "Cada luminária passa por impressão 3D precisa, acabamento manual e revisão antes do envio.",
    },
    {
      icon: ShieldCheck,
      title: "Material PLA premium",
      text: "Usamos PLA de alta qualidade, com excelente acabamento visual e escolha consciente de material.",
    },
    {
      icon: Wand2,
      title: "Iluminação LED",
      text: "Luz suave para criar atmosfera, destacar a peça e transformar o ambiente com conforto.",
    },
    {
      icon: PackageCheck,
      title: "Cuidados",
      text: "Limpe com pano seco e macio. Evite exposição prolongada ao sol, água e calor excessivo.",
    },
    {
      icon: MessageCircle,
      title: "FAQ",
      text: "Tem dúvidas sobre personalização, prazo ou presente? Fale conosco pelo WhatsApp antes da compra.",
    },
  ];

  return (
    <section className="mx-auto max-w-7xl px-6 pb-28 pt-8 md:pb-32 md:pt-16">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sections.map(({ icon: Icon, title, text }) => (
          <article key={title} className="rounded-3xl p-6 glass cinematic hover:-translate-y-1 hover:shadow-glow">
            <div className="grid h-11 w-11 place-items-center rounded-full bg-primary/10 text-primary">
              <Icon className="h-5 w-5" />
            </div>
            <h2 className="mt-5 font-display text-xl">{title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function ProductSkeleton() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <div className="grid gap-10 lg:grid-cols-2">
        <div>
          <div className="aspect-square rounded-[2.25rem] shimmer" />
          <div className="mt-4 flex gap-3">
            <div className="h-20 w-20 rounded-2xl shimmer" />
            <div className="h-20 w-20 rounded-2xl shimmer" />
            <div className="h-20 w-20 rounded-2xl shimmer" />
          </div>
        </div>
        <div className="rounded-[2rem] p-8 glass">
          <div className="h-4 w-32 rounded-full shimmer" />
          <div className="mt-6 h-14 max-w-md rounded-2xl shimmer" />
          <div className="mt-5 h-24 rounded-3xl shimmer" />
          <div className="mt-8 h-36 rounded-3xl shimmer" />
          <div className="mt-6 h-14 rounded-full shimmer" />
        </div>
      </div>
    </section>
  );
}
