import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, PackageCheck, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/checkout/success")({
  validateSearch: (search: Record<string, unknown>) => ({
    order: typeof search.order === "string" ? search.order : "",
  }),
  head: () => ({
    meta: [
      { title: "Pedido recebido - JANGO3D" },
      {
        name: "description",
        content: "Seu pedido JANGO3D foi recebido com sucesso.",
      },
    ],
  }),
  component: CheckoutSuccessPage,
});

type OrderSummary = {
  id: string;
  customer_name: string;
  items: Array<{
    name: string;
    color: string;
    size: string;
    personalization?: string;
    quantity: number;
  }>;
  total: number;
  production_days: number;
  payment_method: string;
  payment_status: string;
};

const formatBRL = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function CheckoutSuccessPage() {
  const { order: orderId } = Route.useSearch();
  const [order, setOrder] = useState<OrderSummary | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(orderId));

  useEffect(() => {
    if (!orderId) return;

    let isMounted = true;

    async function run() {
      const { data } = await supabase
        .from("orders")
        .select("id,customer_name,items,total,production_days,payment_method,payment_status")
        .eq("id", orderId)
        .single();

      if (!isMounted) return;

      if (data) {
        setOrder({
          id: data.id,
          customer_name: data.customer_name,
          items: Array.isArray(data.items) ? data.items : [],
          total: Number(data.total ?? 0),
          production_days: Number(data.production_days ?? 0),
          payment_method: data.payment_method ?? "",
          payment_status: data.payment_status ?? "",
        });
      }

      setIsLoading(false);
    }

    void run();
    return () => {
      isMounted = false;
    };
  }, [orderId]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_45%_at_50%_8%,rgba(255,190,80,.14)_0%,transparent_62%)]" />
        <section className="relative mx-auto max-w-5xl px-6 py-16 md:py-24">
          <div className="rounded-[2.5rem] p-8 text-center shadow-soft glass md:p-12">
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-primary/10 text-primary shadow-glow">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <p className="mt-8 text-xs uppercase tracking-[0.28em] text-primary/85">
              Pedido recebido
            </p>
            <h1 className="mt-4 font-display text-5xl leading-tight text-balance md:text-6xl">
              Obrigado pela sua compra.
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-pretty text-muted-foreground">
              Recebemos seu pedido e enviamos o resumo para o atendimento JANGO3D. Você receberá as próximas orientações em breve.
            </p>

            {isLoading ? (
              <div className="mx-auto mt-10 h-40 max-w-2xl rounded-3xl shimmer" />
            ) : order ? (
              <div className="mx-auto mt-10 max-w-2xl rounded-3xl border border-border/70 bg-background/35 p-6 text-left">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Número do pedido</p>
                    <p className="mt-1 font-display text-2xl">#{order.id.slice(0, 8)}</p>
                  </div>
                  <div className="text-left md:text-right">
                    <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Total</p>
                    <p className="mt-1 font-display text-2xl text-primary">{formatBRL(order.total)}</p>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  {order.items.map((item, index) => (
                    <div key={`${item.name}-${index}`} className="rounded-2xl border border-border/60 bg-card/25 p-4">
                      <p className="font-medium">{item.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {item.color} - {item.size} · Qtd. {item.quantity}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Personalização: {item.personalization || "Sem personalização"}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/8 p-4">
                  <PackageCheck className="h-5 w-5 text-primary" />
                  <p className="text-sm text-muted-foreground">
                    Produção estimada: <span className="text-foreground">{order.production_days} dias úteis</span>
                  </p>
                </div>
              </div>
            ) : (
              <p className="mt-10 text-muted-foreground">
                Pedido criado. Não foi possível carregar o resumo completo agora.
              </p>
            )}

            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <Link
                to="/colecao"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground shadow-glow cinematic hover:-translate-y-0.5"
              >
                <Sparkles className="h-4 w-4" />
                Explorar mais peças
              </Link>
              <Link
                to="/"
                className="rounded-full border border-border/80 bg-card/35 px-6 py-3.5 text-sm font-medium cinematic hover:-translate-y-0.5 hover:bg-card/60"
              >
                Voltar ao início
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
