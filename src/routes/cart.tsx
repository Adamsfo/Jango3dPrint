import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, ShoppingBag, Sparkles, Trash2, WalletCards } from "lucide-react";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { useCart, type CartItem } from "@/hooks/useCart";
import { buildWhatsappUrl } from "@/lib/whatsapp";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Carrinho - JANGO3D" },
      {
        name: "description",
        content: "Revise suas peças personalizadas JANGO3D antes do checkout.",
      },
    ],
  }),
  component: CartPage,
});

const formatBRL = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function CartPage() {
  const {
    items,
    updateQuantity,
    removeItem,
    clearCart,
    cartTotal,
    subtotal,
    personalizationTotal,
    averageProductionDays,
  } = useCart();

  const checkoutWhatsappUrl = buildWhatsappUrl(
    `Olá! Vim pelo site da Jango3D e quero finalizar este pedido:

${items
  .map(
    (item) => `${item.name}
Variante:
${item.color} - ${item.size}

Personalização:
${item.personalization || "Sem personalização"}

Preço:
${formatBRL(item.final_price)}
Quantidade:
${item.quantity}`,
  )
  .join("\n\n---\n\n")}

Total:
${formatBRL(cartTotal)}`,
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_45%_at_18%_8%,rgba(255,190,80,.12)_0%,transparent_62%),radial-gradient(45%_40%_at_82%_25%,rgba(255,145,45,.08)_0%,transparent_68%)]" />
        <section className="relative mx-auto max-w-7xl px-6 py-12 md:py-16">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-primary/85">
                Carrinho JANGO3D
              </p>
              <h1 className="mt-4 font-display text-5xl leading-tight text-balance md:text-6xl">
                Sua seleção premium.
              </h1>
              <p className="mt-5 max-w-2xl text-pretty text-muted-foreground">
                Revise modelos, variantes, personalizações e prazos antes de seguir para o checkout.
              </p>
            </div>

            {items.length ? (
              <button
                onClick={clearCart}
                className="w-fit rounded-full border border-border/80 bg-card/30 px-5 py-2.5 text-xs font-medium uppercase tracking-widest text-muted-foreground cinematic hover:-translate-y-0.5 hover:bg-card/60 hover:text-foreground"
              >
                Limpar carrinho
              </button>
            ) : null}
          </div>

          {items.length ? (
            <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_380px] lg:items-start">
              <div className="space-y-4">
                {items.map((item, index) => (
                  <CartItemCard
                    key={`${item.product_id}-${item.variant_id ?? index}-${item.personalization}-${index}`}
                    item={item}
                    onDecrease={() => updateQuantity(index, item.quantity - 1)}
                    onIncrease={() => updateQuantity(index, item.quantity + 1)}
                    onRemove={() => removeItem(index)}
                  />
                ))}
              </div>

              <aside className="rounded-[2rem] p-6 shadow-soft glass lg:sticky lg:top-32">
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-full bg-primary/10 text-primary">
                    <WalletCards className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                      Resumo
                    </p>
                    <h2 className="font-display text-2xl">Pedido</h2>
                  </div>
                </div>

                <div className="mt-7 space-y-4 text-sm">
                  <SummaryRow label="Subtotal" value={formatBRL(subtotal)} />
                  <SummaryRow label="Personalizações" value={formatBRL(personalizationTotal)} />
                  <SummaryRow
                    label="Prazo médio"
                    value={`${averageProductionDays} dias úteis`}
                  />
                  <div className="border-t border-border/70 pt-4">
                    <SummaryRow label="Total" value={formatBRL(cartTotal)} highlight />
                  </div>
                </div>

                <a
                  href={checkoutWhatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-4 text-sm font-medium text-primary-foreground shadow-glow cinematic hover:-translate-y-0.5 hover:bg-primary/90"
                >
                  <ShoppingBag className="h-4 w-4" />
                  Preparar checkout
                </a>

                <p className="mt-4 text-center text-xs leading-relaxed text-muted-foreground">
                  Estrutura pronta para Mercado Pago, Stripe, Pix e checkout dedicado.
                </p>
              </aside>
            </div>
          ) : (
            <EmptyCart />
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}

function CartItemCard({
  item,
  onDecrease,
  onIncrease,
  onRemove,
}: {
  item: CartItem;
  onDecrease: () => void;
  onIncrease: () => void;
  onRemove: () => void;
}) {
  return (
    <article className="grid gap-5 rounded-[2rem] p-4 shadow-soft glass cinematic hover:-translate-y-0.5 hover:shadow-glow md:grid-cols-[168px_1fr] md:p-5">
      <Link to="/produto/$slug" params={{ slug: item.slug }} className="group overflow-hidden rounded-3xl bg-card">
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            className="aspect-square w-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="aspect-square w-full shimmer" />
        )}
      </Link>

      <div className="flex flex-col justify-between gap-5">
        <div className="flex flex-col justify-between gap-4 md:flex-row">
          <div>
            <Link to="/produto/$slug" params={{ slug: item.slug }}>
              <h2 className="font-display text-2xl cinematic hover:text-[#ffbf5e]">{item.name}</h2>
            </Link>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <Badge>{item.color}</Badge>
              <Badge>{item.size}</Badge>
              <Badge>{item.production_days} dias úteis</Badge>
            </div>
            {item.personalization ? (
              <p className="mt-4 text-sm text-muted-foreground">
                Personalização: <span className="text-foreground">{item.personalization}</span>
              </p>
            ) : null}
          </div>

          <div className="text-left md:text-right">
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Total</p>
            <p className="mt-1 font-display text-2xl">
              {formatBRL(item.final_price * item.quantity)}
            </p>
            {item.customization_price > 0 ? (
              <p className="mt-1 text-xs text-primary">
                Inclui {formatBRL(item.customization_price)} de personalização
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 rounded-full border border-border/80 bg-background/45 p-1">
            <button
              onClick={onDecrease}
              className="grid h-9 w-9 place-items-center rounded-full cinematic hover:bg-card/70"
              aria-label="Diminuir quantidade"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="w-8 text-center text-sm">{item.quantity}</span>
            <button
              onClick={onIncrease}
              className="grid h-9 w-9 place-items-center rounded-full cinematic hover:bg-card/70"
              aria-label="Aumentar quantidade"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          <button
            onClick={onRemove}
            className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/25 px-4 py-2 text-xs uppercase tracking-widest text-muted-foreground cinematic hover:-translate-y-0.5 hover:text-foreground"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Remover
          </button>
        </div>
      </div>
    </article>
  );
}

function SummaryRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`flex items-center justify-between gap-4 ${highlight ? "font-display text-2xl text-foreground" : "text-muted-foreground"}`}>
      <span>{label}</span>
      <span className={highlight ? "text-primary" : "text-foreground"}>{value}</span>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-border/70 bg-card/35 px-3 py-1.5 text-muted-foreground">
      {children}
    </span>
  );
}

function EmptyCart() {
  return (
    <div className="mt-12 grid min-h-[420px] place-items-center rounded-[2.25rem] p-8 text-center shadow-soft glass">
      <div className="max-w-md">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary shadow-glow">
          <Sparkles className="h-7 w-7" />
        </div>
        <h2 className="mt-6 font-display text-4xl">Sua coleção ainda está vazia.</h2>
        <p className="mt-4 text-pretty text-muted-foreground">
          Explore as peças JANGO3D e monte uma seleção personalizada com acabamento premium.
        </p>
        <Link
          to="/colecao"
          className="mt-8 inline-flex items-center justify-center rounded-full bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground shadow-glow cinematic hover:-translate-y-0.5 hover:bg-primary/90"
        >
          Explorar peças
        </Link>
      </div>
    </div>
  );
}
