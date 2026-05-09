import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, Copy, QrCode, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { useCart } from "@/hooks/useCart";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/checkout/pix")({
  validateSearch: (search: Record<string, unknown>) => ({
    order: typeof search.order === "string" ? search.order : "",
    payment: typeof search.payment === "string" ? search.payment : "",
  }),
  head: () => ({
    meta: [
      { title: "Pagamento Pix - JANGO3D" },
      {
        name: "description",
        content: "Finalize seu pagamento Pix JANGO3D com QRCode e copia e cola.",
      },
    ],
  }),
  component: PixPaymentPage,
});

type PixSession = {
  order_id: string;
  payment_id: string;
  status: string;
  amount: number;
  qr_code: string;
  qr_code_base64: string;
  total: number;
  production_days: number;
  total_delivery_days: number;
};

const formatBRL = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function PixPaymentPage() {
  const { order, payment } = Route.useSearch();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const [pixSession, setPixSession] = useState<PixSession | null>(null);
  const [paymentStatus, setPaymentStatus] = useState("pending");
  const [copied, setCopied] = useState(false);
  const [hasCompletedPayment, setHasCompletedPayment] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("jango3d_pix_payment");
      if (!raw) return;

      const parsed = JSON.parse(raw);
      setPixSession(parsed);
      setPaymentStatus(parsed?.status ?? "pending");
    } catch {
      setPixSession(null);
    }
  }, []);

  useEffect(() => {
    if (!payment && !order) return;

    const checkStatus = async () => {
      if (payment) {
        const { data: statusData, error: statusError } = await supabase.functions.invoke("check-payment-status", {
          body: {
            payment_id: payment,
            order_id: order,
          },
        });

        const liveStatus = statusData?.status ?? statusData?.order_status;
        if (!statusError && liveStatus) {
          setPaymentStatus(liveStatus);
          setPixSession((current) => (current ? { ...current, status: liveStatus } : current));
          return;
        }
      }

      const query = supabase.from("payments").select("status,payment_id").limit(1);
      const { data } = payment
        ? await query.eq("payment_id", payment)
        : await query.eq("order_id", order);

      const status = data?.[0]?.status;
      if (status) {
        setPaymentStatus(status);
        setPixSession((current) => (current ? { ...current, status } : current));
      }
    };

    void checkStatus();
    const timer = window.setInterval(checkStatus, 5000);
    return () => window.clearInterval(timer);
  }, [order, payment]);

  const isPaid = paymentStatus === "approved" || paymentStatus === "paid";
  const qrImage = pixSession?.qr_code_base64
    ? `data:image/png;base64,${pixSession.qr_code_base64}`
    : "";

  const statusLabel = useMemo(() => {
    if (isPaid) return "Pagamento aprovado";
    if (paymentStatus === "rejected") return "Pagamento recusado";
    if (paymentStatus === "cancelled") return "Pagamento cancelado";
    return "Aguardando pagamento";
  }, [isPaid, paymentStatus]);

  const copyPixCode = async () => {
    if (!pixSession?.qr_code) return;

    await navigator.clipboard.writeText(pixSession.qr_code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    if (!isPaid || hasCompletedPayment) return;

    setHasCompletedPayment(true);
    clearCart();
    window.localStorage.removeItem("jango3d_pix_payment");

    const orderId = order || pixSession?.order_id || "";

    if (orderId) {
      void supabase
        .from("orders")
        .update({
          payment_status: "paid",
          status: "paid",
          mercado_pago_status: "approved",
        })
        .eq("id", orderId);
    }

    window.setTimeout(() => {
      void navigate({ to: "/checkout/success", search: { order: orderId } });
    }, 1400);
  }, [clearCart, hasCompletedPayment, isPaid, navigate, order, pixSession?.order_id]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_45%_at_50%_8%,rgba(255,190,80,.14)_0%,transparent_62%)]" />
        <section className="relative mx-auto max-w-6xl px-6 py-14 md:py-20">
          <div className="grid gap-8 lg:grid-cols-[1fr_420px] lg:items-start">
            <div className="rounded-[2.5rem] p-8 shadow-soft glass md:p-10">
              <p className="text-xs uppercase tracking-[0.28em] text-primary/85">Pagamento Pix</p>
              <h1 className="mt-4 font-display text-5xl leading-tight text-balance md:text-6xl">
                Finalize seu pagamento.
              </h1>
              <p className="mt-5 max-w-xl text-pretty text-muted-foreground">
                Escaneie o QRCode ou copie o código Pix para concluir sua compra com segurança.
              </p>

              <div className="mt-8 flex w-fit items-center gap-3 rounded-full border border-primary/25 bg-primary/10 px-4 py-2 text-sm text-primary">
                {isPaid ? <CheckCircle2 className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                {statusLabel}
              </div>

              {isPaid ? (
                <p className="mt-4 max-w-xl rounded-3xl border border-primary/25 bg-primary/10 px-5 py-4 text-sm text-primary">
                  Pagamento aprovado. Estamos preparando seu pedido e redirecionando você.
                </p>
              ) : null}

              <div className="mt-8 grid max-w-xl place-items-center rounded-[2rem] border border-border/70 bg-background/45 p-6">
                {qrImage ? (
                  <img src={qrImage} alt="QRCode Pix" className="w-full max-w-[320px] rounded-3xl bg-white p-4" />
                ) : (
                  <div className="grid h-72 w-full max-w-[320px] place-items-center rounded-3xl shimmer">
                    <QrCode className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={copyPixCode}
                disabled={!pixSession?.qr_code}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground shadow-glow cinematic hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Copy className="h-4 w-4" />
                {copied ? "Código copiado" : "Copiar código Pix"}
              </button>

              {pixSession?.qr_code ? (
                <p className="mt-4 line-clamp-3 max-w-xl break-all rounded-3xl border border-border/70 bg-card/25 p-4 text-xs text-muted-foreground">
                  {pixSession.qr_code}
                </p>
              ) : null}
            </div>

            <aside className="rounded-[2rem] p-6 shadow-soft glass lg:sticky lg:top-32">
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Resumo</p>
              <h2 className="mt-2 font-display text-3xl">Pedido</h2>

              <div className="mt-7 space-y-4 text-sm">
                <SummaryRow label="Total" value={formatBRL(pixSession?.total ?? pixSession?.amount ?? 0)} highlight />
                <SummaryRow label="Produção" value={`${pixSession?.production_days ?? 0} dias úteis`} />
                <SummaryRow label="Receba em até" value={`${pixSession?.total_delivery_days ?? 0} dias úteis`} />
                <SummaryRow label="Pedido" value={`#${(order || pixSession?.order_id || "").slice(0, 8)}`} />
              </div>

              <div className="mt-7 rounded-3xl border border-primary/20 bg-primary/8 p-4">
                <p className="text-sm text-muted-foreground">
                  A confirmação é automática. Esta página verifica o status a cada 5 segundos.
                </p>
              </div>

              {isPaid ? (
                <Link
                  to="/checkout/success"
                  search={{ order: order || pixSession?.order_id || "" }}
                  className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-primary px-6 py-4 text-sm font-medium text-primary-foreground shadow-glow cinematic hover:-translate-y-0.5"
                >
                  Ver pedido
                </Link>
              ) : null}
            </aside>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function SummaryRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`flex items-center justify-between gap-4 ${highlight ? "font-display text-2xl" : "text-muted-foreground"}`}>
      <span>{label}</span>
      <span className={highlight ? "text-primary" : "text-foreground"}>{value}</span>
    </div>
  );
}
