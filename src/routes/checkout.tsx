import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CreditCard, MapPin, QrCode, ShieldCheck, ShoppingBag, Sparkles, Truck, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/hooks/useCart";
import { supabase } from "@/lib/supabase";
import { buildWhatsappUrl } from "@/lib/whatsapp";
import { calculateShipping, getDeliveryEstimate, type ShippingOption } from "@/services/shipping";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout - JANGO3D" },
      {
        name: "description",
        content: "Finalize seu pedido JANGO3D com uma experiência premium e segura.",
      },
    ],
  }),
  component: CheckoutPage,
});

type CustomerForm = {
  customer_name: string;
  email: string;
  phone: string;
  cpf: string;
  cep: string;
  street: string;
  number: string;
  complement: string;
  district: string;
  city: string;
  state: string;
  payment_method: "pix" | "card";
};

const CHECKOUT_STORAGE_KEY = "jango3d_checkout_data";
const FALLBACK_SHIPPING_PRICE = 19.9;

const initialForm: CustomerForm = {
  customer_name: "",
  email: "",
  phone: "",
  cpf: "",
  cep: "",
  street: "",
  number: "",
  complement: "",
  district: "",
  city: "",
  state: "",
  payment_method: "pix",
};

const formatBRL = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const formatBusinessDays = (days: number) => `${days} ${days === 1 ? "dia útil" : "dias úteis"}`;

const onlyDigits = (value: string) => value.replace(/\D/g, "");

const maskPhone = (value: string) => {
  const digits = onlyDigits(value).slice(0, 11);

  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

const maskCpf = (value: string) => {
  const digits = onlyDigits(value).slice(0, 11);

  return digits
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");
};

const maskCep = (value: string) => {
  const digits = onlyDigits(value).slice(0, 8);
  return digits.replace(/^(\d{5})(\d)/, "$1-$2");
};

type PersistedCheckoutData = Omit<CustomerForm, "email" | "payment_method">;

const persistedFields: Array<keyof PersistedCheckoutData> = [
  "customer_name",
  "phone",
  "cpf",
  "cep",
  "street",
  "number",
  "complement",
  "district",
  "city",
  "state",
];

const readPersistedCheckoutData = (): Partial<PersistedCheckoutData> => {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(CHECKOUT_STORAGE_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};

    return parsed;
  } catch {
    return {};
  }
};

const persistCheckoutData = (form: CustomerForm) => {
  if (typeof window === "undefined") return;

  const data = persistedFields.reduce<Partial<PersistedCheckoutData>>((acc, field) => {
    acc[field] = form[field];
    return acc;
  }, {});

  window.localStorage.setItem(CHECKOUT_STORAGE_KEY, JSON.stringify(data));
};

function CheckoutPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, subtotal, personalizationTotal, cartTotal, clearCart } = useCart();
  const [form, setForm] = useState<CustomerForm>(initialForm);
  const [isCepLoading, setIsCepLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [autoFillMessage, setAutoFillMessage] = useState("");
  const [hasHydratedForm, setHasHydratedForm] = useState(false);
  const [lastFetchedCep, setLastFetchedCep] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof CustomerForm, string>>>({});
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedShippingId, setSelectedShippingId] = useState("");
  const [isShippingLoading, setIsShippingLoading] = useState(false);
  const [shippingError, setShippingError] = useState("");

  const selectedShipping =
    shippingOptions.find((option) => option.id === selectedShippingId) ?? shippingOptions[0];
  const shippingPrice = selectedShipping?.price ?? FALLBACK_SHIPPING_PRICE;
  const total = cartTotal + shippingPrice;
  const productionDays = useMemo(
    () => Math.max(0, ...items.map((item) => item.production_days)),
    [items],
  );
  const deliveryDays = selectedShipping?.delivery_days ?? 0;
  const totalDeliveryDays = getDeliveryEstimate(productionDays, deliveryDays);

  const setField = (field: keyof CustomerForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: "" }));
  };

  useEffect(() => {
    const persisted = readPersistedCheckoutData();
    const hasPersistedData = Object.values(persisted).some((value) => Boolean(value));
    const authEmail = typeof user?.email === "string" ? user.email : "";

    setForm((current) => ({
      ...current,
      ...persisted,
      phone: persisted.phone ? maskPhone(persisted.phone) : current.phone,
      cpf: persisted.cpf ? maskCpf(persisted.cpf) : current.cpf,
      cep: persisted.cep ? maskCep(persisted.cep) : current.cep,
      email: authEmail || current.email,
    }));

    if (authEmail && hasPersistedData) {
      setAutoFillMessage("✓ Dados preenchidos automaticamente");
    } else if (authEmail) {
      setAutoFillMessage("✓ E-mail preenchido automaticamente");
    } else if (hasPersistedData) {
      setAutoFillMessage("✓ Último endereço carregado");
    }

    setHasHydratedForm(true);
  }, [user?.email]);

  useEffect(() => {
    if (!hasHydratedForm) return;

    persistCheckoutData(form);
  }, [
    form.customer_name,
    form.phone,
    form.cpf,
    form.cep,
    form.street,
    form.number,
    form.complement,
    form.district,
    form.city,
    form.state,
    hasHydratedForm,
  ]);

  const fetchAddressByCep = async (cepValue = form.cep) => {
    const cep = onlyDigits(cepValue);
    if (cep.length !== 8) return;

    setIsCepLoading(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();

      if (!data?.erro) {
        setForm((current) => ({
          ...current,
          street: data.logradouro ?? current.street,
          district: data.bairro ?? current.district,
          city: data.localidade ?? current.city,
          state: data.uf ?? current.state,
        }));
        setAutoFillMessage("✓ Endereço preenchido automaticamente");
        setFieldErrors((current) => ({ ...current, cep: "" }));
      } else {
        setFieldErrors((current) => ({ ...current, cep: "CEP não encontrado." }));
      }
    } finally {
      setIsCepLoading(false);
    }
  };

  useEffect(() => {
    const cep = onlyDigits(form.cep);
    if (cep.length !== 8 || cep === lastFetchedCep) return;

    setLastFetchedCep(cep);
    void fetchAddressByCep(form.cep);
  }, [form.cep, lastFetchedCep]);

  useEffect(() => {
    const cep = onlyDigits(form.cep);
    if (cep.length !== 8 || !items.length) {
      setShippingOptions([]);
      setSelectedShippingId("");
      return;
    }

    let isMounted = true;

    async function run() {
      setIsShippingLoading(true);
      setShippingError("");

      const result = await calculateShipping({ items, destinationCep: cep });

      if (!isMounted) return;

      setShippingOptions(result.options);
      setSelectedShippingId(result.options[0]?.id ?? "");
      setShippingError(result.message);
      setIsShippingLoading(false);
    }

    void run();
    return () => {
      isMounted = false;
    };
  }, [form.cep, items]);

  const validate = () => {
    const phoneDigits = onlyDigits(form.phone);
    const cpfDigits = onlyDigits(form.cpf);
    const cepDigits = onlyDigits(form.cep);
    const nextFieldErrors: Partial<Record<keyof CustomerForm, string>> = {};

    if (!items.length) return "Seu carrinho está vazio.";
    if (!form.customer_name.trim()) return "Informe seu nome.";
    if (!form.email.trim()) return "Informe seu e-mail.";
    if (!phoneDigits) return "Informe seu telefone.";
    if (phoneDigits.length < 10 || phoneDigits.length > 11) {
      nextFieldErrors.phone = "Telefone deve ter 10 ou 11 dígitos.";
    }
    if (cpfDigits && cpfDigits.length !== 11) {
      nextFieldErrors.cpf = "CPF deve ter 11 dígitos.";
    }
    if (cepDigits.length !== 8) {
      nextFieldErrors.cep = "CEP deve ter 8 dígitos.";
    }
    if (Object.keys(nextFieldErrors).length) {
      setFieldErrors(nextFieldErrors);
      return "Revise os campos destacados.";
    }
    if (!form.cep.trim() || !form.street.trim() || !form.number.trim() || !form.city.trim() || !form.state.trim()) {
      return "Complete o endereço de entrega.";
    }

    return "";
  };

  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setIsSubmitting(true);

    const orderItems = items.map((item) => ({
      product_id: item.product_id,
      variant_id: item.variant_id,
      name: item.name,
      image: item.image,
      color: item.color,
      size: item.size,
      personalization: item.personalization,
      quantity: item.quantity,
      base_price: item.base_price,
      customization_price: item.customization_price,
      final_price: item.final_price,
    }));

    const address = {
      cep: form.cep,
      street: form.street,
      number: form.number,
      complement: form.complement,
      district: form.district,
      city: form.city,
      state: form.state,
    };

    const { data, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: user?.id ?? null,
        customer_name: form.customer_name,
        email: form.email,
        phone: form.phone,
        cpf: form.cpf,
        items: orderItems,
        subtotal,
        customization_total: personalizationTotal,
        shipping: shippingPrice,
        total,
        payment_method: form.payment_method,
        payment_status: "pending",
        status: "pending",
        address,
        production_days: productionDays,
        mercado_pago_status: "pending",
        tracking_code: selectedShipping
          ? `${selectedShipping.company} - ${selectedShipping.name}`
          : null,
      })
      .select("id")
      .single();

    if (orderError || !data?.id) {
      setError("Não foi possível criar seu pedido. Tente novamente.");
      setIsSubmitting(false);
      return;
    }

    const whatsappUrl = buildWhatsappUrl(
      `Cliente:
Nome: ${form.customer_name}
Telefone: ${form.phone}

Produtos:
${items
  .map(
    (item) => `- ${item.name}
  Variante: ${item.color} - ${item.size}
  Personalização: ${item.personalization || "Sem personalização"}
  Quantidade: ${item.quantity}`,
  )
  .join("\n")}

Total: ${formatBRL(total)}
Frete: ${selectedShipping ? `${selectedShipping.company} ${selectedShipping.name} - ${formatBRL(selectedShipping.price)}` : "Fallback"}
Prazo produção: ${productionDays} dias úteis
Receba em até: ${totalDeliveryDays} dias úteis`,
    );

    window.open(whatsappUrl, "_blank", "noreferrer");
    clearCart();
    await navigate({ to: "/checkout/success", search: { order: data.id } });
  };

  if (!items.length) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <section className="mx-auto grid min-h-[60vh] max-w-5xl place-items-center px-6 py-20 text-center">
          <div className="rounded-[2.25rem] p-10 shadow-soft glass">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary shadow-glow">
              <ShoppingBag className="h-7 w-7" />
            </div>
            <h1 className="mt-6 font-display text-4xl">Seu carrinho está vazio.</h1>
            <p className="mt-4 text-muted-foreground">Escolha uma peça antes de iniciar o checkout.</p>
            <Link
              to="/colecao"
              className="mt-8 inline-flex rounded-full bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground shadow-glow cinematic hover:-translate-y-0.5"
            >
              Explorar peças
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
      <main className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_45%_at_18%_8%,rgba(255,190,80,.12)_0%,transparent_62%),radial-gradient(45%_40%_at_82%_25%,rgba(255,145,45,.08)_0%,transparent_68%)]" />
        <section className="relative mx-auto max-w-7xl px-6 py-12 md:py-16">
          <p className="text-xs uppercase tracking-[0.28em] text-primary/85">Checkout JANGO3D</p>
          <h1 className="mt-4 font-display text-5xl leading-tight text-balance md:text-6xl">
            Finalize sua compra com segurança.
          </h1>
          <p className="mt-5 max-w-2xl text-pretty text-muted-foreground">
            Revise seus dados e conclua o pagamento de forma rápida e segura.
          </p>

          <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_390px] lg:items-start">
            <div className="space-y-5">
              <CheckoutSection icon={UserRound} title="Cliente">
                {autoFillMessage ? (
                  <p className="mb-4 w-fit rounded-full border border-primary/25 bg-primary/10 px-4 py-2 text-xs font-medium text-primary">
                    {autoFillMessage}
                  </p>
                ) : null}
                <div className="grid gap-4 md:grid-cols-2">
                  <Input label="Nome completo" value={form.customer_name} onChange={(e) => setField("customer_name", e.target.value)} />
                  <Input
                    label="E-mail"
                    type="email"
                    value={form.email}
                    readOnly={Boolean(user?.email)}
                    helper={user?.email ? "E-mail da sua conta" : undefined}
                    onChange={(e) => setField("email", e.target.value)}
                  />
                  <Input
                    label="Telefone"
                    inputMode="tel"
                    value={form.phone}
                    error={fieldErrors.phone}
                    onChange={(e) => setField("phone", maskPhone(e.target.value))}
                  />
                  <Input
                    label="CPF"
                    inputMode="numeric"
                    value={form.cpf}
                    error={fieldErrors.cpf}
                    onChange={(e) => setField("cpf", maskCpf(e.target.value))}
                  />
                </div>
              </CheckoutSection>

              <CheckoutSection icon={MapPin} title="Endereço">
                <div className="grid gap-4 md:grid-cols-3">
                  <Input
                    label="CEP"
                    inputMode="numeric"
                    value={form.cep}
                    error={fieldErrors.cep}
                    onBlur={() => fetchAddressByCep()}
                    onChange={(e) => setField("cep", maskCep(e.target.value))}
                    helper={isCepLoading ? "Buscando endereço..." : "Preenchimento automático"}
                  />
                  <Input label="Cidade" value={form.city} onChange={(e) => setField("city", e.target.value)} />
                  <Input label="UF" value={form.state} onChange={(e) => setField("state", e.target.value.toUpperCase())} />
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-[1fr_140px]">
                  <Input label="Rua" value={form.street} onChange={(e) => setField("street", e.target.value)} />
                  <Input label="Número" value={form.number} onChange={(e) => setField("number", e.target.value)} />
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <Input label="Bairro" value={form.district} onChange={(e) => setField("district", e.target.value)} />
                  <Input label="Complemento" value={form.complement} onChange={(e) => setField("complement", e.target.value)} />
                </div>
              </CheckoutSection>

              <CheckoutSection icon={Truck} title="Frete">
                {isShippingLoading ? (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">Calculando frete...</p>
                    <div className="h-20 rounded-3xl shimmer" />
                    <div className="h-20 rounded-3xl shimmer" />
                  </div>
                ) : shippingOptions.length ? (
                  <div className="space-y-3">
                    {shippingOptions.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setSelectedShippingId(option.id)}
                        className={`w-full rounded-3xl border p-4 text-left cinematic hover:-translate-y-0.5 ${
                          selectedShippingId === option.id
                            ? "border-primary/60 bg-primary/10 shadow-glow"
                            : "border-border/70 bg-card/25 hover:border-primary/35"
                        }`}
                      >
                        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                          <div>
                            <p className="font-medium">
                              {option.company} {option.name}
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              Entrega estimada: {formatBusinessDays(option.delivery_days)}
                            </p>
                          </div>
                          <div className="text-left md:text-right">
                            <p className="font-display text-xl text-primary">{formatBRL(option.price)}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                    {shippingError ? (
                      <p className="rounded-2xl border border-primary/20 bg-primary/8 px-4 py-3 text-sm text-muted-foreground">
                        {shippingError}
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <p className="rounded-3xl border border-border/70 bg-card/25 p-4 text-sm text-muted-foreground">
                    Informe o CEP para calcular o frete automaticamente.
                  </p>
                )}
              </CheckoutSection>

              <CheckoutSection icon={CreditCard} title="Pagamento">
                <div className="grid gap-3 md:grid-cols-2">
                  <PaymentButton
                    active={form.payment_method === "pix"}
                    icon={QrCode}
                    title="Pix"
                    text="QRCode e copia e cola após confirmação."
                    onClick={() => setForm((current) => ({ ...current, payment_method: "pix" }))}
                  />
                  <PaymentButton
                    active={form.payment_method === "card"}
                    icon={CreditCard}
                    title="Cartão"
                    text="Estrutura preparada para Mercado Pago."
                    onClick={() => setForm((current) => ({ ...current, payment_method: "card" }))}
                  />
                </div>
              </CheckoutSection>
            </div>

            <aside className="rounded-[2rem] p-6 shadow-soft glass lg:sticky lg:top-32">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-full bg-primary/10 text-primary">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Resumo</p>
                  <h2 className="font-display text-2xl">Pedido</h2>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {items.map((item) => (
                  <div key={`${item.product_id}-${item.variant_id}-${item.personalization}`} className="flex gap-3">
                    <img src={item.image} alt={item.name} className="h-16 w-16 rounded-2xl object-cover" loading="lazy" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.color} - {item.size}</p>
                      <p className="text-xs text-muted-foreground">Qtd. {item.quantity}</p>
                    </div>
                    <p className="text-sm">{formatBRL(item.final_price * item.quantity)}</p>
                  </div>
                ))}
              </div>

              <div className="mt-7 space-y-3 border-t border-border/70 pt-5 text-sm">
                <SummaryRow label="Subtotal" value={formatBRL(subtotal)} />
                <SummaryRow label="Personalizações" value={formatBRL(personalizationTotal)} />
                <SummaryRow label="Frete" value={formatBRL(shippingPrice)} />
                <SummaryRow label="Produção" value={formatBusinessDays(productionDays)} />
                <SummaryRow label="Entrega" value={formatBusinessDays(deliveryDays)} />
                <SummaryRow label="Receba em até" value={formatBusinessDays(totalDeliveryDays)} />
                <div className="border-t border-border/70 pt-4">
                  <SummaryRow label="Total" value={formatBRL(total)} highlight />
                </div>
              </div>

              {form.payment_method === "pix" ? (
                <div className="mt-6 rounded-3xl border border-primary/20 bg-primary/8 p-4">
                  <div className="flex items-center gap-3">
                    <QrCode className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">Pix preparado</p>
                      <p className="text-xs text-muted-foreground">QRCode será gerado na integração Mercado Pago.</p>
                    </div>
                  </div>
                </div>
              ) : null}

              {error ? (
                <p className="mt-5 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </p>
              ) : null}

              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-4 text-sm font-medium text-primary-foreground shadow-glow cinematic hover:-translate-y-0.5 hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Sparkles className="h-4 w-4" />
                {isSubmitting ? "Criando pedido..." : "Finalizar pedido"}
              </button>
            </aside>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function CheckoutSection({ icon: Icon, title, children }: { icon: typeof UserRound; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[2rem] p-6 shadow-soft glass">
      <div className="mb-5 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <h2 className="font-display text-2xl">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Input({
  label,
  helper,
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; helper?: string; error?: string }) {
  return (
    <label className="block">
      <span className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">{label}</span>
      <input
        {...props}
        className={`mt-2 w-full rounded-full border bg-background/55 px-5 py-3 text-sm outline-none transition-all duration-300 placeholder:text-muted-foreground/60 focus:border-primary/70 focus:shadow-[0_0_28px_rgba(255,190,80,.12)] ${
          error ? "border-destructive/50 text-destructive" : "border-border/80"
        }`}
      />
      {error ? (
        <span className="mt-1.5 block text-xs text-destructive">{error}</span>
      ) : helper ? (
        <span className="mt-1.5 block text-xs text-muted-foreground">{helper}</span>
      ) : null}
    </label>
  );
}

function PaymentButton({
  active,
  icon: Icon,
  title,
  text,
  onClick,
}: {
  active: boolean;
  icon: typeof QrCode;
  title: string;
  text: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-3xl border p-5 text-left cinematic hover:-translate-y-0.5 ${
        active ? "border-primary/60 bg-primary/10 shadow-glow" : "border-border/70 bg-card/25 hover:border-primary/35"
      }`}
    >
      <Icon className="h-5 w-5 text-primary" />
      <p className="mt-4 font-display text-xl">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{text}</p>
    </button>
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
