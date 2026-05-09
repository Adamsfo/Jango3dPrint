import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AlertCircle, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { useCart } from "@/hooks/useCart";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/checkout/processing")({
  validateSearch: (search: Record<string, unknown>) => ({
    order: typeof search.order === "string" ? search.order : "",
    payment: typeof search.payment === "string" ? search.payment : "",
  }),
  head: () => ({
    meta: [
      { title: "Processando pagamento - JANGO3D" },
      {
        name: "description",
        content: "Estamos confirmando seu pagamento JANGO3D com segurança.",
      },
    ],
  }),
  component: ProcessingPaymentPage,
});

type ProcessingSession = {
  order_id: string;
  payment_id: string;
  status: string;
  total: number;
};

function ProcessingPaymentPage() {
  const { order, payment } = Route.useSearch();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const [session, setSession] = useState<ProcessingSession | null>(null);
  const [status, setStatus] = useState("pending");
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("jango3d_processing_payment");
      if (!raw) return;

      const parsed = JSON.parse(raw);
      setSession(parsed);
      setStatus(parsed?.status ?? "pending");
    } catch {
      setSession(null);
    }
  }, []);

  useEffect(() => {
    const paymentId = payment || session?.payment_id;
    const orderId = order || session?.order_id;
    if (!paymentId && !orderId) return;

    const checkStatus = async () => {
      if (paymentId) {
        const { data, error } = await supabase.functions.invoke("check-payment-status", {
          body: {
            payment_id: paymentId,
            order_id: orderId,
          },
        });

        const liveStatus = data?.status ?? data?.order_status;
        if (!error && liveStatus) {
          setStatus(liveStatus);
          setSession((current) => (current ? { ...current, status: liveStatus } : current));
          return;
        }
      }

      const query = supabase.from("orders").select("status,payment_status,mercado_pago_status").limit(1);
      const { data } = orderId
        ? await query.eq("id", orderId)
        : await supabase.from("payments").select("status").eq("payment_id", paymentId).limit(1);

      const fallbackStatus = data?.[0]?.payment_status ?? data?.[0]?.mercado_pago_status ?? data?.[0]?.status;
      if (fallbackStatus) setStatus(fallbackStatus);
    };

    void checkStatus();
    const timer = window.setInterval(checkStatus, 5000);
    return () => window.clearInterval(timer);
  }, [order, payment, session?.order_id, session?.payment_id]);

  const normalizedStatus = status === "paid" ? "approved" : status;
  const isApproved = normalizedStatus === "approved";
  const isRejected = ["rejected", "cancelled"].includes(normalizedStatus);

  useEffect(() => {
    if (!isApproved || hasRedirected) return;

    setHasRedirected(true);
    clearCart();
    window.localStorage.removeItem("jango3d_processing_payment");

    const orderId = order || session?.order_id || "";
    window.setTimeout(() => {
      void navigate({ to: "/checkout/success", search: { order: orderId } });
    }, 1700);
  }, [clearCart, hasRedirected, isApproved, navigate, order, session?.order_id]);

  const steps = useMemo(
    () => [
      { label: "Verificando pagamento", done: true },
      { label: "Confirmando pedido", done: isApproved || normalizedStatus === "pending" },
      { label: "Preparando produção", done: isApproved },
    ],
    [isApproved, normalizedStatus],
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_45%_at_50%_8%,rgba(255,190,80,.14)_0%,transparent_62%)]" />
        <section className="relative mx-auto grid min-h-[70vh] max-w-5xl place-items-center px-6 py-16 md:py-24">
          <div className="w-full rounded-[2.5rem] p-8 text-center shadow-soft glass md:p-12">
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-primary/10 text-primary shadow-glow">
              {isRejected ? (
                <AlertCircle className="h-10 w-10" />
              ) : isApproved ? (
                <CheckCircle2 className="h-10 w-10" />
              ) : (
                <Loader2 className="h-10 w-10 animate-spin" />
              )}
            </div>

            <p className="mt-8 text-xs uppercase tracking-[0.28em] text-primary/85">
              Checkout seguro
            </p>
            <h1 className="mt-4 font-display text-5xl leading-tight text-balance md:text-6xl">
              Estamos confirmando seu pagamento.
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-pretty text-muted-foreground">
              Aguarde alguns segundos enquanto validamos sua compra com segurança.
            </p>

            <div className="mx-auto mt-10 h-1 max-w-xl overflow-hidden rounded-full bg-card/60">
              <div
                className={`h-full rounded-full bg-primary shadow-glow transition-all duration-700 ${
                  isRejected ? "w-2/3" : isApproved ? "w-full" : "w-2/3"
                }`}
              />
            </div>

            <div className="mx-auto mt-10 grid max-w-xl gap-3 text-left">
              {steps.map((step) => (
                <div key={step.label} className="flex items-center gap-3 rounded-3xl border border-border/70 bg-card/25 px-5 py-4">
                  <CheckCircle2 className={`h-5 w-5 ${step.done ? "text-primary" : "text-muted-foreground/45"}`} />
                  <span className={step.done ? "text-foreground" : "text-muted-foreground"}>{step.label}</span>
                </div>
              ))}
            </div>

            {isRejected ? (
              <div className="mx-auto mt-8 max-w-xl rounded-3xl border border-destructive/30 bg-destructive/10 p-5 text-left">
                <p className="font-medium text-destructive">Pagamento não aprovado.</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Você pode tentar novamente com outro cartão ou escolher Pix no checkout.
                </p>
                <Link
                  to="/checkout"
                  className="mt-5 inline-flex rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-glow cinematic hover:-translate-y-0.5"
                >
                  Voltar ao checkout
                </Link>
              </div>
            ) : (
              <p className="mt-8 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-5 py-2 text-sm text-primary">
                <Sparkles className="h-4 w-4" />
                {isApproved ? "Pagamento aprovado. Redirecionando..." : "Validação em andamento"}
              </p>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
