import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Check, Minus, Plus, ShoppingBag, Sparkles, Truck } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { getProduct, formatBRL, type Product } from "@/lib/products";

export const Route = createFileRoute("/produto/$slug")({
  loader: ({ params }) => {
    const product = getProduct(params.slug);
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.product.name} — JANGO3D` },
          { name: "description", content: loaderData.product.description },
          { property: "og:image", content: loaderData.product.image },
        ]
      : [],
  }),
  notFoundComponent: () => (
    <div className="grid min-h-screen place-items-center">
      <div className="text-center">
        <h1 className="font-display text-3xl">Produto não encontrado</h1>
        <Link to="/colecao" className="mt-4 inline-block text-muted-foreground hover:text-foreground">← voltar à coleção</Link>
      </div>
    </div>
  ),
  errorComponent: () => <div className="grid min-h-screen place-items-center">Algo deu errado.</div>,
  component: ProductPage,
});

function ProductPage() {
  const { product } = Route.useLoaderData() as { product: Product };
  const [color, setColor] = useState(product.colors[0]);
  const [size, setSize] = useState(product.sizes[0]);
  const [power, setPower] = useState(product.power[0]);
  const [intensity, setIntensity] = useState(product.intensity[1] ?? product.intensity[0]);
  const [name, setName] = useState("");
  const [qty, setQty] = useState(1);
  const [active, setActive] = useState(product.gallery[0]);
  const [lightOn, setLightOn] = useState(true);

  const total = useMemo(() => {
    const personal = name.trim() ? 30 : 0;
    return (product.basePrice + size.priceDelta + power.priceDelta + personal) * qty;
  }, [product.basePrice, size, power, name, qty]);

  return (
    <div className="min-h-screen">
      <Header />
      <section className="mx-auto max-w-7xl px-6 py-12">
        <Link to="/colecao" className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground">
          ← Coleção
        </Link>

        <div className="mt-8 grid gap-12 lg:grid-cols-2">
          {/* Gallery */}
          <div>
            <div className={`relative overflow-hidden rounded-[2rem] bg-gradient-warm shadow-soft ${lightOn ? "glow-aura" : ""}`}>
              <img src={active} alt={product.name} className="aspect-square w-full object-cover" />
              <button
                onClick={() => setLightOn((v) => !v)}
                className="absolute bottom-5 right-5 inline-flex items-center gap-2 rounded-full bg-background/85 px-4 py-2 text-xs font-medium backdrop-blur hover:bg-background"
              >
                <Sparkles className="h-3.5 w-3.5" /> {lightOn ? "Apagar luz" : "Acender luz"}
              </button>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {product.gallery.map((g, i) => (
                <button
                  key={i}
                  onClick={() => setActive(g)}
                  className={`overflow-hidden rounded-2xl border transition ${active === g ? "border-foreground" : "border-border/60"}`}
                >
                  <img src={g} alt="" className="aspect-square w-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Details */}
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">{product.category}</p>
            <h1 className="mt-2 font-display text-4xl md:text-5xl text-balance">{product.name}</h1>
            <p className="mt-3 text-lg text-muted-foreground">{product.tagline}</p>

            <p className="mt-6 text-pretty leading-relaxed text-muted-foreground">{product.story}</p>

            <div className="mt-8 space-y-6 rounded-3xl border border-border/60 bg-cream p-6">
              {/* Cor */}
              <div>
                <Label>Cor · {color.name}</Label>
                <div className="mt-3 flex gap-2">
                  {product.colors.map((c) => (
                    <button
                      key={c.name}
                      onClick={() => setColor(c)}
                      style={{ backgroundColor: c.hex }}
                      className={`h-9 w-9 rounded-full border-2 transition ${color.name === c.name ? "border-foreground" : "border-background"}`}
                      aria-label={c.name}
                    />
                  ))}
                </div>
              </div>

              {/* Tamanho */}
              <div>
                <Label>Tamanho</Label>
                <div className="mt-3 flex flex-wrap gap-2">
                  {product.sizes.map((s) => (
                    <Chip key={s.name} active={size.name === s.name} onClick={() => setSize(s)}>
                      {s.name}
                    </Chip>
                  ))}
                </div>
              </div>

              {/* Alimentação */}
              <div>
                <Label>Alimentação</Label>
                <div className="mt-3 flex flex-wrap gap-2">
                  {product.power.map((p) => (
                    <Chip key={p.name} active={power.name === p.name} onClick={() => setPower(p)}>
                      {p.name}
                    </Chip>
                  ))}
                </div>
              </div>

              {/* Intensidade */}
              <div>
                <Label>Intensidade da luz</Label>
                <div className="mt-3 flex flex-wrap gap-2">
                  {product.intensity.map((i) => (
                    <Chip key={i} active={intensity === i} onClick={() => setIntensity(i)}>
                      {i}
                    </Chip>
                  ))}
                </div>
              </div>

              {/* Nome */}
              <div>
                <Label>Personalize com um nome (+ R$ 30)</Label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value.slice(0, 12))}
                  placeholder="Ex: Helena"
                  maxLength={12}
                  className="mt-3 w-full rounded-full border border-border bg-background px-5 py-3 text-sm outline-none transition focus:border-foreground"
                />
                <p className="mt-1.5 text-xs text-muted-foreground">{name.length}/12 caracteres</p>
              </div>
            </div>

            {/* Compra */}
            <div className="mt-8 flex items-end justify-between gap-6">
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Total</p>
                <p className="font-display text-4xl">{formatBRL(total)}</p>
                <p className="mt-1 text-xs text-muted-foreground">ou 6x sem juros · PIX com 5% off</p>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-border bg-background p-1">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="grid h-9 w-9 place-items-center rounded-full hover:bg-cream">
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="w-6 text-center text-sm">{qty}</span>
                <button onClick={() => setQty(qty + 1)} className="grid h-9 w-9 place-items-center rounded-full hover:bg-cream">
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <button className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-foreground px-6 py-4 text-sm font-medium text-background transition hover:bg-foreground/85">
              <ShoppingBag className="h-4 w-4" /> Adicionar ao carrinho
            </button>

            <ul className="mt-8 grid gap-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Fabricado sob encomenda em {product.leadTimeDays + (name ? 2 : 0)} dias úteis</li>
              <li className="flex items-center gap-2"><Truck className="h-4 w-4 text-primary" /> Frete calculado no checkout · enviamos para todo o Brasil</li>
              <li className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Embalagem presente inclusa</li>
            </ul>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{children}</p>;
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-sm transition ${
        active ? "border-foreground bg-foreground text-background" : "border-border bg-background hover:border-foreground/40"
      }`}
    >
      {children}
    </button>
  );
}
