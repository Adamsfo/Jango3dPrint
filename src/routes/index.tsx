import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Heart, Package, Palette, Sparkles, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { ProductCard } from "@/components/site/ProductCard";
import { supabase } from "@/lib/supabase";
import hero from "@/assets/hero-nursery.jpg";
import process from "@/assets/process.jpg";

type Product = {
  slug: string;
  name: string;
  tagline: string;
  basePrice: number;
  category: string;
  image: string;
};

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
  }, []);

  return (
    <div className="min-h-screen">
      <Header />
      <Hero />
      <Trust />
      <Featured />
      <Personalize />
      <Process />
      <Testimonials />
      <Cta />
      <Footer />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden depth-section reveal" data-reveal>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_55%_at_20%_10%,color-mix(in_oklch,var(--color-primary)_18%,transparent)_0%,transparent_60%),radial-gradient(55%_45%_at_80%_35%,color-mix(in_oklch,var(--color-primary)_10%,transparent)_0%,transparent_65%)]" />
      <div className="mx-auto grid max-w-7xl gap-10 px-6 pt-12 pb-24 md:grid-cols-2 md:items-center md:pt-20">
        <div className="animate-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/40 px-4 py-1.5 text-xs uppercase tracking-widest text-muted-foreground backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" /> Edição artesanal · Brasil
          </span>
          <h1 className="mt-6 font-display text-5xl leading-[1.05] text-balance md:text-6xl lg:text-7xl">
            Luz que abraça os primeiros sonhos.
          </h1>
          <p className="mt-6 max-w-md text-pretty text-lg text-muted-foreground">
            Luminárias decorativas infantis feitas à mão em impressão 3D — pensadas para acolher
            cada noite com carinho, personalização e luz quente.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/colecao"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground shadow-glow cinematic hover:bg-primary/90 hover:shadow-glow hover:-translate-y-0.5"
            >
              Ver coleção <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/personalizar"
              className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/30 px-6 py-3.5 text-sm font-medium cinematic hover:bg-card/60 hover:-translate-y-0.5"
            >
              Personalizar a sua
            </Link>
          </div>
          <div className="mt-10 flex items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-accent text-accent" />
              ))}
            </div>
            <span>+1.200 famílias acolhidas</span>
          </div>
        </div>

        <div className="relative">
          <div className="glow-aura relative overflow-hidden rounded-[2rem] shadow-soft">
            <img
              src={hero}
              alt="Luminária 3D em quarto infantil aconchegante"
              width={1600}
              height={1200}
              className="aspect-[4/5] w-full object-cover md:aspect-[5/6] opacity-95"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/70 via-background/0 to-background/0" />
          </div>
          <div className="absolute -bottom-6 -left-6 hidden rounded-2xl border border-border/80 bg-card/50 p-4 shadow-soft backdrop-blur md:block">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              Luz quente regulável
            </p>
            <p className="font-display text-lg">3 intensidades</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Trust() {
  const items = [
    { icon: Heart, label: "Feito à mão com carinho" },
    { icon: Palette, label: "Personalização exclusiva" },
    { icon: Package, label: "Embalagem presente" },
    { icon: Sparkles, label: "Luz LED quente e segura" },
  ];
  return (
    <section className="border-y border-border/70 bg-background reveal" data-reveal>
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-6 py-10 md:grid-cols-4">
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

function Featured() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function run() {
      setIsLoading(true);

      const { data, error } = await supabase
        .from("products")
        .select("slug,name,category,image,price,featured")
        .eq("featured", true)
        .limit(12);

      if (!isMounted) return;

      if (error || !data) {
        setProducts([]);
        setIsLoading(false);
        return;
      }

      const mapped: Product[] = data
        .map((row) => {
          const slug = typeof (row as any).slug === "string" ? (row as any).slug : "";
          const name = typeof (row as any).name === "string" ? (row as any).name : "";

          const tagline = "";
          const imageRaw =
            typeof (row as any).image === "string"
              ? (row as any).image
              : typeof (row as any).image_url === "string"
                ? (row as any).image_url
                : "";
          const image = imageRaw.length > 0 ? imageRaw : "/placeholder.jpg";
          const categoryRaw = typeof (row as any).category === "string" ? (row as any).category : "Personalizadas";
          const category = categoryRaw || "Personalizadas";

          const basePriceRaw =
            typeof (row as any).price === "number"
              ? (row as any).price
              : typeof (row as any).basePrice === "number"
                ? (row as any).basePrice
                : typeof (row as any).base_price === "number"
                  ? (row as any).base_price
                  : 0;
          const basePrice = Number.isFinite(basePriceRaw) ? basePriceRaw : 0;

          return {
            slug,
            name,
            tagline,
            category,
            image,
            basePrice,
          };
        })
        .filter((p) => Boolean(p.slug && p.name));

      setProducts(mapped);
      setIsLoading(false);
    }

    void run();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="mx-auto max-w-7xl px-6 py-24 reveal" data-reveal>
      <div className="flex items-end justify-between gap-6">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Coleção em destaque
          </p>
          <h2 className="mt-2 font-display text-4xl md:text-5xl">Iluminando soninhos</h2>
        </div>
        <Link
          to="/colecao"
          className="hidden text-sm text-muted-foreground hover:text-foreground md:inline-flex"
        >
          Ver tudo →
        </Link>
      </div>
      <div className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="relative overflow-hidden rounded-3xl bg-gradient-warm shadow-soft">
                  <div className="aspect-[4/5] w-full bg-foreground/5" />
                </div>
                <div className="mt-5 flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="h-5 w-44 rounded bg-foreground/5" />
                    <div className="h-4 w-56 rounded bg-foreground/5" />
                  </div>
                  <div className="space-y-2 text-right">
                    <div className="h-3 w-16 rounded bg-foreground/5" />
                    <div className="h-5 w-20 rounded bg-foreground/5" />
                  </div>
                </div>
              </div>
            ))
          : products.map((p) => <ProductCard key={p.slug} product={p} />)}
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

function Process() {
  const steps = [
    { n: "01", t: "Você escolhe", d: "Modelo, cor e personalização" },
    { n: "02", t: "Imprimimos à mão", d: "Camadas finas e acabamento artesanal" },
    { n: "03", t: "Embalamos com carinho", d: "Caixa presente pronta para entregar" },
    { n: "04", t: "Chega em casa", d: "Frete calculado e rastreio em tempo real" },
  ];
  return (
    <section className="mx-auto max-w-7xl px-6 py-24 reveal" data-reveal>
      <div className="grid gap-12 md:grid-cols-2 md:items-center">
        <div className="overflow-hidden rounded-[2rem] shadow-soft hover-gold cinematic">
          <img
            src={process}
            alt="Processo artesanal de impressão 3D"
            loading="lazy"
            className="h-full w-full object-cover"
          />
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">O processo</p>
          <h2 className="mt-3 font-display text-4xl md:text-5xl">Cada peça tem uma história.</h2>
          <p className="mt-5 max-w-md text-muted-foreground">
            Não trabalhamos com estoque. Tudo é impresso sob encomenda, camada por camada, para que
            cada luminária chegue até você como uma pequena obra de arte.
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
      n: "Camila R.",
      c: "A Lua Cheia transformou as noites da minha filha. A luz é mágica, parece um abraço.",
    },
    {
      n: "Bruno & Ana",
      c: "Personalizamos com o nome da Helena. Chegou impecável, embalagem linda. Vale cada centavo.",
    },
    {
      n: "Marina S.",
      c: "Atendimento incrível e produto premium. Já é o terceiro que compro de presente.",
    },
  ];
  return (
    <section className="bg-background py-24 reveal" data-reveal>
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Famílias JANGO3D
          </p>
          <h2 className="mt-3 font-display text-4xl md:text-5xl">Histórias que iluminam.</h2>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {reviews.map((r) => (
            <figure
              key={r.n}
              className="rounded-3xl border border-border/70 bg-card/40 p-8 shadow-soft glass hover-gold cinematic hover:-translate-y-0.5 hover:shadow-glow"
            >
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                ))}
              </div>
              <blockquote className="mt-5 text-pretty text-lg leading-relaxed">"{r.c}"</blockquote>
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
