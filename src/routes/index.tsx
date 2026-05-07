import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Heart, Palette, Play, Sparkles, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { supabase } from "@/lib/supabase";

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  image: string;
  category: string;
  stock: number;
  featured: boolean;
  customizable: boolean;
  customization_label: string;
  customization_price: number;
  customization_max_chars?: number;
  principal_home: boolean;
  gallery?: string[];
  video_url?: string;
}

interface ProductVariant {
  id: string;
  product_id: string;
  color: string;
  size: string;
  price: number;
  image: string;
  stock: number;
}

const parseMoney = (value: unknown) => {
  const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : 0;
  return Number.isFinite(n) ? n : 0;
};

const formatBRL = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const mapProduct = (row: any): Product => ({
  id: typeof row?.id === "string" ? row.id : "",
  name: typeof row?.name === "string" ? row.name : "",
  slug: typeof row?.slug === "string" ? row.slug : "",
  description: typeof row?.description === "string" ? row.description : "",
  price: parseMoney(row?.price),
  image: typeof row?.image === "string" && row.image.length > 0 ? row.image : "",
  category: typeof row?.category === "string" && row.category.length > 0 ? row.category : "Produto",
  stock: typeof row?.stock === "number" && Number.isFinite(row.stock) ? row.stock : 0,
  featured: Boolean(row?.featured),
  customizable: Boolean(row?.customizable),
  customization_label:
    typeof row?.customization_label === "string" && row.customization_label.length > 0
      ? row.customization_label
      : "Personalização",
  customization_price: parseMoney(row?.customization_price),
  customization_max_chars:
    typeof row?.customization_max_chars === "number" && Number.isFinite(row.customization_max_chars)
      ? row.customization_max_chars
      : 12,
  principal_home: row?.principal_home === true,
  gallery: Array.isArray(row?.gallery)
    ? row.gallery.filter((url: unknown): url is string => typeof url === "string" && url.length > 0)
    : undefined,
  video_url:
    typeof row?.video_url === "string" && row.video_url.length > 0 ? row.video_url : undefined,
});

const mapVariant = (row: any): ProductVariant => ({
  id: typeof row?.id === "string" ? row.id : "",
  product_id: typeof row?.product_id === "string" ? row.product_id : "",
  color: typeof row?.color === "string" ? row.color : "",
  size: typeof row?.size === "string" ? row.size : "",
  price: parseMoney(row?.price),
  image: typeof row?.image === "string" && row.image.length > 0 ? row.image : "",
  stock: typeof row?.stock === "number" && Number.isFinite(row.stock) ? row.stock : 0,
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "JANGO3D — Luminárias infantis em impressão 3D" },
      {
        name: "description",
        content:
          "Luminárias decorativas infantis feitas à mão em impressão 3D. Personalize a sua e ilumine o quartinho com aconchego.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [isLoadingFeatured, setIsLoadingFeatured] = useState(true);
  const [processImages, setProcessImages] = useState<string[]>([]);
  const [heroProducts, setHeroProducts] = useState<Product[]>([]);
  const [isLoadingHero, setIsLoadingHero] = useState(true);

  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (!nodes.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            (e.target as HTMLElement).classList.add("is-visible");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.15 },
    );

    for (const n of nodes) io.observe(n);
    return () => io.disconnect();
  }, [heroProducts.length, featuredProducts.length, isLoadingHero, isLoadingFeatured]);

  useEffect(() => {
    let isMounted = true;

    async function run() {
      setIsLoadingFeatured(true);

      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("featured", true)
        .limit(12);

      if (!isMounted) return;

      const products =
        !error && data ? data.map(mapProduct).filter((p) => Boolean(p.id && p.slug && p.name)) : [];

      setFeaturedProducts(products);
      setIsLoadingFeatured(false);
    }

    void run();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function run() {
      const { data, error } = await supabase
        .from("products")
        .select("image")
        .not("image", "is", null)
        .limit(12);

      if (!isMounted) return;

      const images =
        !error && data
          ? Array.from(
              new Set(
                data
                  .map((row: any) => (typeof row?.image === "string" ? row.image : ""))
                  .filter(Boolean),
              ),
            )
          : [];

      setProcessImages(images);
    }

    void run();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function run() {
      setIsLoadingHero(true);
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("principal_home", true);

      if (!isMounted) return;

      console.log("HOME PRODUCTS", data);

      if (error || !data || data.length === 0) {
        setHeroProducts([]);
        setIsLoadingHero(false);
        return;
      }

      setHeroProducts(
        data
          .map(mapProduct)
          .filter((p) => Boolean(p.id && p.slug && p.name && p.principal_home === true)),
      );
      setIsLoadingHero(false);
    }

    void run();
    return () => {
      isMounted = false;
    };
  }, []);

  const homeProducts = heroProducts.filter((p) => p.principal_home === true);

  return (
    <div className="min-h-screen">
      <Header />
      {isLoadingHero ? (
        <HeroLoading />
      ) : homeProducts?.length ? (
        homeProducts.map((product) => (
          <div key={product.id}>
            <Hero product={product} />
          </div>
        ))
      ) : (
        <HeroEmptyState />
      )}
      <Trust />
      <Featured products={featuredProducts} isLoading={isLoadingFeatured} />
      {/* <Personalize /> */}
      <Process images={processImages} />
      <Testimonials />
      {/* <Cta /> */}
      <Footer />
    </div>
  );
}

function HeroLoading() {
  return (
    <section className="relative overflow-hidden depth-section reveal" data-reveal>
      <div className="mx-auto grid max-w-7xl gap-10 px-6 pt-12 pb-24 md:grid-cols-2 md:items-center md:pt-20">
        <div className="space-y-5">
          <div className="h-8 w-56 rounded-full shimmer" />
          <div className="h-20 max-w-xl rounded-3xl shimmer" />
          <div className="h-28 max-w-lg rounded-3xl shimmer" />
        </div>
        <div className="aspect-[4/5] rounded-[2rem] shimmer md:aspect-[5/6]" />
      </div>
    </section>
  );
}

function HeroEmptyState() {
  return (
    <section className="relative overflow-hidden depth-section reveal" data-reveal>
      <div className="mx-auto max-w-7xl px-6 py-24">
        <div className="rounded-[2rem] border border-border/70 bg-card/30 p-10 text-center glass">
          <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">
            Produto em destaque
          </p>
          <h1 className="mt-4 font-display text-4xl text-balance md:text-5xl">
            Em breve, uma luminária especial por aqui.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Cadastre um produto com principal_home ativo no Supabase para montar esta seção
            automaticamente.
          </p>
        </div>
      </div>
    </section>
  );
}

function Hero({ product }: { product: Product }) {
  const [customName, setCustomName] = useState("");
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [isLoadingVariants, setIsLoadingVariants] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedMedia, setSelectedMedia] = useState<string>("");
  const [showVideo, setShowVideo] = useState(false);

  const selected = product;
  const maxCustomizationChars = selected?.customization_max_chars ?? 12;

  useEffect(() => {
    setCustomName("");
  }, [selected?.id]);

  useEffect(() => {
    if (customName.length > maxCustomizationChars) {
      setCustomName(customName.slice(0, maxCustomizationChars));
    }
  }, [customName, maxCustomizationChars]);

  useEffect(() => {
    let isMounted = true;

    async function run() {
      if (!selected?.id) {
        setVariants([]);
        setSelectedColor("");
        setSelectedSize("");
        setIsLoadingVariants(false);
        return;
      }

      setIsLoadingVariants(true);
      const res = await supabase
        .from("product_variants")
        .select("id,product_id,color,size,price,image,stock")
        .eq("product_id", selected.id);

      if (!isMounted) return;

      if (res.error || !res.data) {
        setVariants([]);
        setSelectedColor("");
        setSelectedSize("");
        setIsLoadingVariants(false);
        return;
      }

      const mapped = res.data.map(mapVariant).filter((v) => Boolean(v.color && v.size));

      setVariants(mapped);
      const first = mapped[0];
      setSelectedColor(first?.color ?? "");
      setSelectedSize(first?.size ?? "");
      setIsLoadingVariants(false);
    }

    void run();
    return () => {
      isMounted = false;
    };
  }, [selected?.id]);

  const colors = Array.from(new Set(variants.map((v) => v.color)));
  const sizes = Array.from(
    new Set(variants.filter((v) => v.color === selectedColor).map((v) => v.size)),
  );
  const currentVariant =
    variants.find((v) => v.color === selectedColor && v.size === selectedSize) ??
    variants.find((v) => v.color === selectedColor) ??
    variants[0];
  const variantImage = currentVariant?.image;
  const productImage = selected?.image ?? "";
  const productGallery = selected?.gallery?.length
    ? selected.gallery
    : productImage
      ? [productImage]
      : [];
  const galleryImages = Array.from(
    new Set([...(variantImage ? [variantImage] : []), ...productGallery].filter(Boolean)),
  );
  const mainImage = showVideo ? "" : selectedMedia || variantImage || productGallery[0] || "";
  const customizationPrice =
    selected?.customizable && customName.trim().length > 0 ? selected.customization_price : 0;
  const price = (currentVariant?.price ?? selected?.price ?? 0) + customizationPrice;
  const availability = currentVariant ? currentVariant.stock > 0 : (selected?.stock ?? 0) > 0;
  const videoUrl = selected?.video_url;
  const isDirectVideo = /\.(mp4|webm|ogg)(\?.*)?$/i.test(videoUrl ?? "");

  useEffect(() => {
    setSelectedMedia(variantImage || productGallery[0] || "");
    setShowVideo(false);
  }, [selected?.id, variantImage]);

  return (
    <section className="relative overflow-hidden depth-section reveal" data-reveal>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_55%_at_20%_10%,color-mix(in_oklch,var(--color-primary)_18%,transparent)_0%,transparent_60%),radial-gradient(55%_45%_at_80%_35%,color-mix(in_oklch,var(--color-primary)_10%,transparent)_0%,transparent_65%)]" />
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-24 md:grid-cols-2 md:items-center md:pt-20">
        <div className="animate-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/40 px-4 py-1.5 text-xs uppercase tracking-widest text-muted-foreground backdrop-blur glass">
            <Sparkles className="h-3.5 w-3.5" /> Configurador · Edição artesanal
          </span>

          <h1 className="mt-6 font-display text-5xl leading-[1.05] text-balance md:text-6xl lg:text-7xl">
            {selected.name}
          </h1>

          <p className="mt-5 max-w-md text-pretty text-base text-muted-foreground md:text-lg">
            {selected?.description?.length
              ? selected.description
              : "Em breve você poderá personalizar a luminária principal da JANGO3D diretamente pela home."}
          </p>

          <div className="mt-8 grid gap-4 rounded-3xl border border-border/70 bg-card/30 p-5 backdrop-blur glass">
            {selected?.customizable ? (
              <div className="grid gap-3">
                <label className="space-y-2">
                  <span className="text-[11px] font-medium uppercase tracking-[0.28em] text-muted-foreground">
                    {selected.customization_label}
                  </span>
                  <input
                    value={customName}
                    maxLength={maxCustomizationChars}
                    onChange={(e) => setCustomName(e.target.value.slice(0, maxCustomizationChars))}
                    placeholder={selected.customization_label}
                    className="h-11 w-full rounded-2xl border border-border/70 bg-background/20 px-4 text-sm text-foreground outline-none cinematic placeholder:text-muted-foreground/70 focus:ring-2 focus:ring-primary/40"
                  />
                  <div className="flex items-center justify-between gap-4 text-xs text-muted-foreground">
                    <span>Máximo de {maxCustomizationChars} caracteres</span>
                    <span>
                      {customName.length}/{maxCustomizationChars} caracteres
                    </span>
                  </div>
                </label>
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium uppercase tracking-[0.28em] text-muted-foreground">
                    Cor
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {selectedColor || (isLoadingVariants ? "Carregando…" : "—")}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {colors.length ? (
                    colors.map((c) => {
                      const active = c === selectedColor;
                      const isHex = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(c);
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => {
                            setSelectedColor(c);
                            const nextSizes = variants
                              .filter((v) => v.color === c)
                              .map((v) => v.size);
                            const next = nextSizes.includes(selectedSize)
                              ? selectedSize
                              : (nextSizes[0] ?? "");
                            setSelectedSize(next);
                          }}
                          className={`rounded-full border cinematic ${
                            active
                              ? "border-primary shadow-glow"
                              : "border-border/70 hover:border-primary/50"
                          } ${isHex ? "h-9 w-9" : "px-4 py-2 text-xs font-medium uppercase tracking-widest"}`}
                          style={isHex ? { backgroundColor: c } : undefined}
                        >
                          {isHex ? null : c}
                        </button>
                      );
                    })
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      {isLoadingVariants ? "Carregando variantes…" : "Sem variantes disponíveis"}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[11px] font-medium uppercase tracking-[0.28em] text-muted-foreground">
                  Tamanho
                </span>
                <div className="flex flex-wrap gap-2">
                  {sizes.length ? (
                    sizes.map((s) => {
                      const active = s === selectedSize;
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setSelectedSize(s)}
                          className={`rounded-full px-4 py-2 text-xs font-medium uppercase tracking-widest cinematic ${
                            active
                              ? "bg-primary text-primary-foreground shadow-glow"
                              : "border border-border/70 bg-background/20 text-foreground hover:bg-card/40"
                          }`}
                        >
                          {s}
                        </button>
                      );
                    })
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      {isLoadingVariants ? "Carregando variantes…" : "Sem tamanhos disponíveis"}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-end justify-between gap-4 border-t border-border/60 pt-4">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-muted-foreground">
                  Preço estimado
                </p>
                <p className="mt-1 font-display text-2xl text-foreground">
                  {price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {isLoadingVariants
                    ? "Carregando disponibilidade…"
                    : availability
                      ? "Disponível"
                      : "Indisponível"}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  to="/personalizar"
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-glow cinematic hover:bg-primary/90 hover:-translate-y-0.5"
                >
                  Personalizar <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/colecao"
                  className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/30 px-6 py-3 text-sm font-medium cinematic hover:bg-card/60 hover:-translate-y-0.5"
                >
                  Ver coleção
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="relative">
          <div
            className="glow-aura lamp-glow relative overflow-hidden rounded-[2rem] shadow-soft hover-gold cinematic"
            style={{
              ["--lamp-color" as any]: /^#/.test(selectedColor)
                ? selectedColor
                : "var(--color-primary)",
            }}
          >
            {showVideo && videoUrl ? (
              <div className="aspect-[4/5] w-full bg-background/80 md:aspect-[5/6]">
                {isDirectVideo ? (
                  <video
                    src={videoUrl}
                    className="h-full w-full object-cover"
                    controls
                    autoPlay
                    playsInline
                  />
                ) : (
                  <iframe
                    src={videoUrl}
                    title={`${selected?.name ?? "Produto"} em vídeo`}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                )}
              </div>
            ) : mainImage ? (
              <img
                key={`${selected?.slug ?? "fallback"}:${mainImage}`}
                src={mainImage}
                alt={selected?.name ?? "Luminária 3D"}
                width={1600}
                height={1200}
                className="aspect-[4/5] w-full object-cover md:aspect-[5/6] opacity-95 cinematic animate-fade-up"
              />
            ) : (
              <div className="grid aspect-[4/5] w-full place-items-center bg-card/30 px-8 text-center md:aspect-[5/6]">
                <p className="max-w-xs text-sm text-muted-foreground">
                  Imagem do produto indisponível no momento.
                </p>
              </div>
            )}
            <div
              className="pointer-events-none absolute inset-0 opacity-70 mix-blend-overlay"
              style={{
                background:
                  `radial-gradient(60% 60% at 20% 20%, ${/^#/.test(selectedColor) ? selectedColor : "#d8b25c"}33 0%, transparent 60%),` +
                  `radial-gradient(50% 50% at 80% 40%, ${/^#/.test(selectedColor) ? selectedColor : "#d8b25c"}22 0%, transparent 65%)`,
              }}
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/70 via-background/0 to-background/0" />

            {selected?.customizable && customName.trim().length > 0 ? (
              <div className="pointer-events-none absolute inset-x-6 bottom-6">
                <div
                  className="name-overlay cinematic"
                  style={{
                    ["--lamp-color" as any]: /^#/.test(selectedColor)
                      ? selectedColor
                      : "var(--color-primary)",
                  }}
                >
                  <span key={customName} className="name-overlay-text animate-fade-up">
                    {customName}
                  </span>
                </div>
              </div>
            ) : null}
            {videoUrl ? (
              <button
                type="button"
                onClick={() => setShowVideo((open) => !open)}
                className="absolute right-5 top-5 inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/25 px-4 py-2 text-xs font-medium uppercase tracking-[0.22em] text-foreground backdrop-blur glass cinematic hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-glow"
              >
                <Play className="h-3.5 w-3.5 text-primary" />
                {showVideo ? "Imagem" : "Vídeo"}
              </button>
            ) : null}
          </div>
          {galleryImages.length > 1 || videoUrl ? (
            <div className="mt-5 flex gap-3 overflow-x-auto pb-2 md:flex-wrap md:overflow-visible">
              {galleryImages.map((image, index) => {
                const active = !showVideo && image === mainImage;

                return (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    onClick={() => {
                      setSelectedMedia(image);
                      setShowVideo(false);
                    }}
                    className={`h-20 w-20 shrink-0 overflow-hidden rounded-2xl border bg-card/30 cinematic hover:-translate-y-0.5 ${
                      active
                        ? "border-primary/70 shadow-glow"
                        : "border-border/70 hover:border-primary/50"
                    }`}
                    aria-label={`Imagem ${index + 1}`}
                  >
                    <img src={image} alt="" className="h-full w-full object-cover" loading="lazy" />
                  </button>
                );
              })}
              {videoUrl ? (
                <button
                  type="button"
                  onClick={() => setShowVideo(true)}
                  className={`grid h-20 w-20 shrink-0 place-items-center rounded-2xl border bg-card/30 cinematic hover:-translate-y-0.5 ${
                    showVideo
                      ? "border-primary/70 shadow-glow"
                      : "border-border/70 hover:border-primary/50"
                  }`}
                  aria-label="Abrir vídeo"
                >
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-primary/15 text-primary">
                    <Play className="h-4 w-4 fill-primary" />
                  </span>
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function Trust() {
  const items = [
    { icon: Heart, label: "Feito à mão com carinho" },
    { icon: Palette, label: "Personalização exclusiva" },
    { icon: Sparkles, label: "Luz LED quente e segura" },
  ];
  return (
    <section className="border-y border-border/70 bg-background reveal" data-reveal>
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-6 py-10 sm:grid-cols-3">
        {items.map((it) => (
          <div key={it.label} className="flex items-center gap-3 text-sm">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-card/50 shadow-soft cinematic hover:-translate-y-0.5 hover:shadow-glow">
              <it.icon className="h-4 w-4 text-primary" />
            </span>
            <span className="text-muted-foreground">{it.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function Featured({ products, isLoading }: { products: Product[]; isLoading: boolean }) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20 reveal" data-reveal>
      <div className="flex items-end justify-between gap-6">
        <div>
          <h2 className="font-display text-4xl md:text-5xl">Produtos em destaque</h2>
          <p className="mt-4 max-w-xl text-muted-foreground">
            Peças selecionadas para configurar com acabamento premium e luz sob medida.
          </p>
        </div>
        <Link
          to="/colecao"
          className="hidden rounded-full border border-border/70 bg-card/30 px-5 py-2.5 text-sm font-medium glass cinematic hover:bg-card/60 md:inline-flex"
        >
          Ver coleção
        </Link>
      </div>

      <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-3xl border border-border/70 bg-card/30 p-4 glass">
                <div className="aspect-[4/5] rounded-2xl shimmer" />
                <div className="mt-5 h-6 w-2/3 rounded-full shimmer" />
                <div className="mt-3 h-4 w-1/2 rounded-full shimmer" />
              </div>
            ))
          : products.map((product) => (
              <Link
                key={product.id}
                to="/produto/$slug"
                params={{ slug: product.slug }}
                className="group block rounded-3xl border border-border/70 bg-card/30 p-4 glass cinematic hover:-translate-y-1 hover:border-primary/50 hover:shadow-glow"
              >
                <div className="overflow-hidden rounded-2xl bg-background/30">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      loading="lazy"
                      className="aspect-[4/5] w-full object-cover cinematic group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="grid aspect-[4/5] place-items-center px-6 text-center text-sm text-muted-foreground">
                      Imagem indisponível
                    </div>
                  )}
                </div>
                <div className="mt-5 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-display text-xl">{product.name}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{product.description}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                      A partir de
                    </p>
                    <p className="mt-1 font-display text-lg">{formatBRL(product.price)}</p>
                  </div>
                </div>
              </Link>
            ))}
      </div>
    </section>
  );
}

function Personalize() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-24 reveal" data-reveal>
      <div className="grid items-center gap-12 rounded-[2rem] bg-gradient-warm p-10 shadow-soft md:grid-cols-2 md:p-16 hover-gold cinematic">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Personalize sua luminária
          </p>
          <h2 className="mt-3 font-display text-4xl md:text-5xl text-balance">
            Uma peça única, com o nome de quem você ama.
          </h2>
          <p className="mt-5 max-w-md text-muted-foreground">
            Escolha a cor, o tamanho, a alimentação e adicione um nome. Imprimimos sob encomenda em
            até 7 dias úteis.
          </p>
          <Link
            to="/personalizar"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground shadow-glow cinematic hover:bg-primary/90 hover:-translate-y-0.5"
          >
            Começar personalização <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <ul className="grid grid-cols-2 gap-4">
          {[
            { t: "Nome", d: "Até 12 caracteres" },
            { t: "Cor", d: "8 tons aconchegantes" },
            { t: "Tamanho", d: "P · M · G" },
            { t: "Alimentação", d: "USB ou tomada" },
          ].map((o) => (
            <li
              key={o.t}
              className="rounded-2xl border border-border/70 bg-card/40 p-5 backdrop-blur glass cinematic hover:-translate-y-0.5 hover:shadow-glow"
            >
              <p className="font-display text-lg">{o.t}</p>
              <p className="mt-1 text-sm text-muted-foreground">{o.d}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Process({ images }: { images: string[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const steps = [
    { n: "01", t: "Escolha sua peça", d: "Modelo, cor, tamanho e personalização do seu jeito." },
    {
      n: "02",
      t: "Produção em detalhes",
      d: "Impressão 3D precisa, camada por camada, com acabamento refinado e atenção aos mínimos detalhes.",
    },
    {
      n: "03",
      t: "Finalização premium",
      d: "Testes de iluminação, revisão manual e preparação cuidadosa para garantir uma experiência impecável.",
    },
    {
      n: "04",
      t: "Entrega rastreada",
      d: "Acompanhamento completo até sua luminária chegar à sua casa com segurança.",
    },
  ];
  const carouselImages = Array.from(new Set(images.filter(Boolean)));

  useEffect(() => {
    if (carouselImages.length <= 1) return;

    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % carouselImages.length);
    }, 4200);

    return () => window.clearInterval(timer);
  }, [carouselImages.length]);

  useEffect(() => {
    if (activeIndex >= carouselImages.length) setActiveIndex(0);
  }, [activeIndex, carouselImages.length]);

  return (
    <section className="mx-auto max-w-7xl px-6 py-20 reveal" data-reveal>
      <div className="grid gap-12 md:grid-cols-2 md:items-center">
        <div className="overflow-hidden rounded-[2rem] shadow-soft hover-gold cinematic">
          <div className="relative aspect-[4/5] bg-card/30 md:aspect-[5/6]">
            {carouselImages.length ? (
              carouselImages.map((image, index) => (
                <img
                  key={`${image}-${index}`}
                  src={image}
                  alt="Produto JANGO3D em destaque"
                  loading="lazy"
                  className={`absolute inset-0 h-full w-full object-cover cinematic ${
                    index === activeIndex ? "opacity-100 scale-100" : "opacity-0 scale-[1.02]"
                  }`}
                />
              ))
            ) : (
              <div className="grid h-full place-items-center px-8 text-center text-sm text-muted-foreground">
                Imagens dos produtos aparecerão aqui assim que forem cadastradas.
              </div>
            )}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
          </div>
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">O processo</p>
          <h2 className="mt-3 font-display text-4xl md:text-5xl">Feita especialmente para você.</h2>
          <p className="mt-5 max-w-xl text-muted-foreground">
            Cada luminária nasce da combinação entre tecnologia, personalização e acabamento
            artesanal. Desenvolvemos nossos próprios designs exclusivos para criar peças únicas que
            transformam ambientes, presentes e momentos especiais em algo memorável.
          </p>
          <ol className="mt-10 space-y-6">
            {steps.map((s) => (
              <li key={s.n} className="flex gap-5">
                <span className="font-display text-2xl text-muted-foreground">{s.n}</span>
                <div>
                  <p className="font-display text-lg">{s.t}</p>
                  <p className="text-sm text-muted-foreground">{s.d}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  const reviews = [
    {
      n: "Ana Clara M.",
      c: "Personalizamos com o nome da nossa filha e o resultado ficou impecável. A luz é suave, o acabamento é muito refinado e virou o detalhe mais especial do quarto.",
    },
    {
      n: "Marcos & Júlia",
      c: "Compramos para presentear e foi uma experiência premium do início ao fim. O design exclusivo chamou atenção imediatamente e a iluminação deixou tudo mais elegante.",
    },
    {
      n: "Beatriz L.",
      c: "A peça tem presença de objeto de decoração, não só luminária. Dá para perceber o cuidado no acabamento, na personalização e na forma como a luz valoriza o ambiente.",
    },
    {
      n: "Rafael P.",
      c: "Escolhi cor, tamanho e personalização para combinar com o escritório. Ficou moderno, sofisticado e com uma luz extremamente agradável para uso diário.",
    },
  ];
  return (
    <section className="bg-background py-24 reveal" data-reveal>
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Família JANGO3D
          </p>
          <h2 className="mt-3 font-display text-4xl md:text-5xl">Histórias que iluminam.</h2>
        </div>
        <div className="mt-14 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 md:grid md:snap-none md:grid-cols-4 md:overflow-visible md:pb-0">
          {reviews.map((r) => (
            <figure
              key={r.n}
              className="min-w-[82%] snap-center rounded-3xl border border-border/70 bg-card/40 p-7 shadow-soft glass hover-gold cinematic hover:-translate-y-1 hover:border-primary/40 hover:shadow-glow sm:min-w-[48%] md:min-w-0"
            >
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                ))}
              </div>
              <blockquote className="mt-5 text-pretty text-base leading-relaxed text-foreground/90">
                "{r.c}"
              </blockquote>
              <figcaption className="mt-6 text-sm text-muted-foreground">— {r.n}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function Cta() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-24 reveal" data-reveal>
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-warm p-12 md:p-20 hover-gold cinematic">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_20%_20%,color-mix(in_oklch,var(--color-primary)_22%,transparent)_0%,transparent_60%),radial-gradient(45%_45%_at_80%_30%,color-mix(in_oklch,var(--color-primary)_14%,transparent)_0%,transparent_65%)]" />
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-primary/20 blur-3xl animate-glow" />
        <div className="relative max-w-xl">
          <h2 className="font-display text-4xl md:text-5xl text-balance">
            Pronto para acender o quartinho dos sonhos?
          </h2>
          <p className="mt-5 text-muted-foreground">
            Comece pela coleção ou crie uma luminária 100% sua.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/colecao"
              className="rounded-full bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground shadow-glow cinematic hover:bg-primary/90 hover:-translate-y-0.5"
            >
              Ver coleção
            </Link>
            <Link
              to="/personalizar"
              className="rounded-full border border-border/70 bg-card/30 px-6 py-3.5 text-sm font-medium glass cinematic hover:bg-card/60 hover:-translate-y-0.5"
            >
              Personalizar
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
