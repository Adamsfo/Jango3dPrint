import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { Check, CreditCard, Loader2, MapPin, Minus, Plus, QrCode, ShieldCheck, ShoppingBag, Sparkles, Truck, UserRound } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/hooks/useCart";
import { supabase } from "@/lib/supabase";
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
  delivery_type: "shipping" | "pickup";
  payment_method: "pix" | "credit_card";
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
  delivery_type: "shipping",
  payment_method: "pix",
};

type MercadoPagoCardFormData = {
  token?: string;
  issuer_id?: string;
  payment_method_id?: string;
  installments?: number;
};

declare global {
  interface Window {
    MercadoPago?: any;
  }
}

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
  "delivery_type",
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
  const location = useLocation();

  if (location.pathname !== "/checkout") {
    return <Outlet />;
  }

  return <CheckoutForm />;
}

function PaymentProcessingOverlay({ open }: { open: boolean }) {
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) return null;

  const steps = ["Validando pagamento", "Criando pedido", "Confirmando transação"] as const;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkout-payment-processing-title"
      aria-busy="true"
      className="fixed inset-0 z-[400] flex items-center justify-center p-6"
    >
      <div className="absolute inset-0 animate-in fade-in-0 bg-black/70 backdrop-blur-md duration-300" aria-hidden />
      <div className="animate-in fade-in-0 zoom-in-95 duration-300 relative mx-4 w-full max-w-[420px]">
        <div className="relative overflow-hidden rounded-[2rem] border border-primary/45 bg-[oklch(0.14_0.012_255/0.94)] px-8 py-10 shadow-[0_0_0_1px_oklch(0.76_0.1_78/0.2),0_0_96px_-20px_oklch(0.78_0.14_78/0.45),var(--shadow-soft)]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(75%_50%_at_50%_-5%,oklch(0.72_0.11_78/0.18),transparent_58%)]" />
          <div className="relative flex flex-col items-center text-center">
            <div className="relative mb-8 grid h-[4.25rem] w-[4.25rem] place-items-center">
              <span className="absolute inset-0 rounded-full border-2 border-primary/30" aria-hidden />
              <span className="absolute inset-[-10px] rounded-full border border-primary/15 opacity-70" aria-hidden />
              <span
                className="absolute inset-[-6px] animate-pulse rounded-full border border-primary/25"
                aria-hidden
              />
              <Loader2 className="relative h-9 w-9 text-primary animate-spin" strokeWidth={2} aria-hidden />
            </div>
            <h2
              id="checkout-payment-processing-title"
              className="text-balance font-display text-[1.4rem] font-medium leading-snug tracking-tight text-foreground md:text-[1.65rem]"
            >
              Estamos processando seu pagamento
            </h2>
            <p className="mt-3 max-w-sm text-pretty text-sm leading-relaxed text-muted-foreground md:text-[15px]">
              Aguarde alguns segundos enquanto validamos sua compra com segurança.
            </p>
            <ul className="mt-9 w-full space-y-3.5 border-t border-primary/15 pt-7 text-left" aria-label="Etapas do processamento">
              {steps.map((label) => (
                <li key={label} className="flex items-center gap-3.5 text-sm text-foreground/95">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/18 text-primary shadow-[0_0_24px_oklch(0.78_0.12_78/0.4)] ring-1 ring-primary/35">
                    <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />
                  </span>
                  <span className="font-medium tracking-tight">{label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function CheckoutForm() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, subtotal, personalizationTotal, cartTotal, clearCart, updateQuantity, removeItem } = useCart();
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

  const isPickup = form.delivery_type === "pickup";
  const selectedShipping =
    shippingOptions.find((option) => option.id === selectedShippingId) ?? shippingOptions[0];
  const shippingPrice = isPickup ? 0 : selectedShipping?.price ?? FALLBACK_SHIPPING_PRICE;
  const total = cartTotal + shippingPrice;
  const productionDays = useMemo(
    () => Math.max(0, ...items.map((item) => item.production_days)),
    [items],
  );
  const deliveryDays = isPickup ? 0 : selectedShipping?.delivery_days ?? 0;
  const totalDeliveryDays = getDeliveryEstimate(productionDays, deliveryDays);

  const setField = (field: keyof CustomerForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: "" }));
  };

  const updateCheckoutQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(index);
      return;
    }

    updateQuantity(index, quantity);
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
    if (isPickup || cep.length !== 8 || !items.length) {
      setShippingOptions([]);
      setSelectedShippingId("");
      setIsShippingLoading(false);
      setShippingError("");
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
  }, [form.cep, isPickup, items]);

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
    if (!isPickup && cepDigits.length !== 8) {
      nextFieldErrors.cep = "CEP deve ter 8 dígitos.";
    }
    if (Object.keys(nextFieldErrors).length) {
      setFieldErrors(nextFieldErrors);
      return "Revise os campos destacados.";
    }
    if (!isPickup && (!form.cep.trim() || !form.street.trim() || !form.number.trim() || !form.city.trim() || !form.state.trim())) {
      return "Complete o endereço de entrega.";
    }

    return "";
  };

  const createOrder = async () => {
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
        delivery_type: form.delivery_type,
        tracking_code: selectedShipping
          ? `${selectedShipping.company} - ${selectedShipping.name}`
          : isPickup
            ? "Retirar na loja"
          : null,
      })
      .select("id")
      .single();

    if (orderError || !data?.id) {
      throw new Error("Não foi possível criar seu pedido. Tente novamente.");
    }

    return { orderId: data.id as string, orderItems };
  };

  const createPayment = async ({
    orderId,
    orderItems,
    method,
    cardData,
  }: {
    orderId: string;
    orderItems: any[];
    method: CustomerForm["payment_method"];
    cardData?: MercadoPagoCardFormData;
  }) => {
    const { data: paymentData, error: paymentError } = await supabase.functions.invoke("create-payment", {
      body: {
        order_id: orderId,
        amount: total,
        payment_method: method,
        customer: {
          name: form.customer_name,
          email: form.email,
          phone: form.phone,
          cpf: form.cpf,
        },
        items: orderItems,
        ...cardData,
      },
    });

    if (paymentError || !paymentData?.payment_id) {
      throw new Error(
        method === "credit_card"
          ? "Não foi possível processar o cartão. Confira os dados e tente novamente."
          : "Não foi possível gerar o Pix. Tente novamente.",
      );
    }

    return paymentData;
  };

  const handleCardPayment = async (cardData: MercadoPagoCardFormData) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      setIsSubmitting(false);
      throw new Error(validationError);
    }

    setError("");

    try {
      const { orderId, orderItems } = await createOrder();
      const paymentData = await createPayment({ orderId, orderItems, method: "credit_card", cardData });
      window.localStorage.setItem(
        "jango3d_processing_payment",
        JSON.stringify({
          ...paymentData,
          order_id: orderId,
          total,
          production_days: productionDays,
          delivery_days: deliveryDays,
          total_delivery_days: totalDeliveryDays,
          items: orderItems,
        }),
      );
      await navigate({
        to: "/checkout/processing",
        search: { order: orderId, payment: paymentData.payment_id },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível processar o cartão.";
      setError(message);
      setIsSubmitting(false);
      throw error;
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      setIsSubmitting(false);
      return;
    }

    setError("");

    if (form.payment_method !== "pix") {
      setIsSubmitting(false);
      return;
    }

    const { orderId, orderItems } = await createOrder().catch((error) => {
      setError(error instanceof Error ? error.message : "Não foi possível criar seu pedido. Tente novamente.");
      setIsSubmitting(false);
      return { orderId: "", orderItems: [] };
    });

    if (!orderId) return;

    const paymentData = await createPayment({ orderId, orderItems, method: "pix" }).catch((error) => {
      setError(error instanceof Error ? error.message : "Não foi possível gerar o Pix. Tente novamente.");
      setIsSubmitting(false);
      return null;
    });

    if (!paymentData) return;

    window.localStorage.setItem(
      "jango3d_pix_payment",
      JSON.stringify({
        ...paymentData,
        order_id: orderId,
        total,
        production_days: productionDays,
        delivery_days: deliveryDays,
        total_delivery_days: totalDeliveryDays,
        items: orderItems,
      }),
    );

    await navigate({ to: "/checkout/pix", search: { order: orderId, payment: paymentData.payment_id } });
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
      <PaymentProcessingOverlay open={isSubmitting} />
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
          <Link
            to="/cart"
            className="mt-6 inline-flex w-fit rounded-full border border-border/80 bg-card/30 px-5 py-2.5 text-xs font-medium uppercase tracking-widest text-muted-foreground cinematic hover:-translate-y-0.5 hover:bg-card/60 hover:text-foreground"
          >
            Voltar ao carrinho
          </Link>

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

              <CheckoutSection icon={Truck} title="Tipo de entrega">
                <div className="grid gap-3 md:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setForm((current) => ({ ...current, delivery_type: "shipping" }))}
                    className={`rounded-3xl border p-5 text-left cinematic hover:-translate-y-0.5 ${
                      form.delivery_type === "shipping"
                        ? "border-primary/60 bg-primary/10 shadow-glow"
                        : "border-border/70 bg-card/25 hover:border-primary/35"
                    }`}
                  >
                    <p className="font-display text-xl">Entrega</p>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      Receba no endereço informado com cálculo automático de frete.
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm((current) => ({ ...current, delivery_type: "pickup" }))}
                    className={`rounded-3xl border p-5 text-left cinematic hover:-translate-y-0.5 ${
                      form.delivery_type === "pickup"
                        ? "border-primary/60 bg-primary/10 shadow-glow"
                        : "border-border/70 bg-card/25 hover:border-primary/35"
                    }`}
                  >
                    <p className="font-display text-xl">Retirar na loja</p>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      Sem frete. Combinamos a retirada assim que a peça estiver pronta.
                    </p>
                  </button>
                </div>
              </CheckoutSection>

              <CheckoutSection icon={MapPin} title="Endereço">
                {isPickup ? (
                  <div className="rounded-3xl border border-primary/20 bg-primary/8 p-5">
                    <p className="font-medium text-primary">Retirada na loja selecionada</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Não calcularemos frete. Após a produção, nossa equipe combina a retirada com você.
                    </p>
                  </div>
                ) : (
                  <>
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
                  </>
                )}
              </CheckoutSection>

              {!isPickup ? (
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
              ) : null}

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
                    active={form.payment_method === "credit_card"}
                    icon={CreditCard}
                    title="Cartão"
                    text="Pagamento por cartão dentro da loja."
                    onClick={() => setForm((current) => ({ ...current, payment_method: "credit_card" }))}
                  />
                </div>
                {form.payment_method === "credit_card" ? (
                  <MercadoPagoCardBrick
                    amount={total}
                    email={form.email}
                    disabled={isSubmitting}
                    onSubmit={handleCardPayment}
                    onError={(message) => setError(message)}
                  />
                ) : null}
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
                {items.map((item, index) => (
                  <div key={`${item.product_id}-${item.variant_id}-${item.personalization}`} className="flex gap-3">
                    <img src={item.image} alt={item.name} className="h-16 w-16 rounded-2xl object-cover" loading="lazy" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.color} - {item.size}</p>
                      <div className="mt-2 flex w-fit items-center gap-1 rounded-full border border-border/70 bg-background/35 p-1">
                        <button
                          type="button"
                          onClick={() => updateCheckoutQuantity(index, item.quantity - 1)}
                          className="grid h-7 w-7 place-items-center rounded-full cinematic hover:bg-card/70"
                          aria-label="Diminuir quantidade"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-6 text-center text-xs">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateCheckoutQuantity(index, item.quantity + 1)}
                          className="grid h-7 w-7 place-items-center rounded-full cinematic hover:bg-card/70"
                          aria-label="Aumentar quantidade"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm">{formatBRL(item.final_price * item.quantity)}</p>
                  </div>
                ))}
              </div>

              <div className="mt-7 space-y-3 border-t border-border/70 pt-5 text-sm">
                <SummaryRow label="Subtotal" value={formatBRL(subtotal)} />
                <SummaryRow label="Personalizações" value={formatBRL(personalizationTotal)} />
                <SummaryRow label="Frete" value={isPickup ? "Retirada na loja" : formatBRL(shippingPrice)} />
                <SummaryRow label="Produção" value={formatBusinessDays(productionDays)} />
                <SummaryRow label="Entrega" value={isPickup ? "Retirada imediata" : formatBusinessDays(deliveryDays)} />
                <SummaryRow label="Receba em até" value={isPickup ? "Retirada imediata" : formatBusinessDays(totalDeliveryDays)} />
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

              {form.payment_method === "credit_card" ? (
                <div className="mt-6 rounded-3xl border border-primary/20 bg-primary/8 p-4">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">Cartão seguro</p>
                      <p className="text-xs text-muted-foreground">Dados processados pelo Mercado Pago Checkout Transparente.</p>
                    </div>
                  </div>
                </div>
              ) : null}

              {error ? (
                <p
                  role="alert"
                  className="animate-in fade-in-0 slide-in-from-bottom-1 duration-300 mt-5 rounded-2xl border border-destructive/35 bg-destructive/12 px-4 py-3.5 text-center text-sm leading-relaxed text-destructive shadow-[0_0_32px_-8px_oklch(0.55_0.18_25/0.35)]"
                >
                  {error}
                </p>
              ) : null}

              {form.payment_method !== "credit_card" ? (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-4 text-sm font-medium text-primary-foreground shadow-glow cinematic hover:-translate-y-0.5 hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  Pagar
                </button>
              ) : (
                <p className="mt-6 rounded-3xl border border-border/70 bg-card/25 p-4 text-center text-sm text-muted-foreground">
                  Preencha os dados do cartão e finalize pelo botão seguro do Mercado Pago.
                </p>
              )}
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

function MercadoPagoCardBrick({
  amount,
  email,
  disabled,
  onSubmit,
  onError,
}: {
  amount: number;
  email: string;
  disabled: boolean;
  onSubmit: (data: MercadoPagoCardFormData) => Promise<void>;
  onError: (message: string) => void;
}) {
  const containerId = "jango3d-card-payment-brick";
  const controllerRef = useRef<any>(null);

  useEffect(() => {
    let isMounted = true;

    const loadScript = () =>
      new Promise<void>((resolve, reject) => {
        if (window.MercadoPago) {
          resolve();
          return;
        }

        const script = document.createElement("script");
        script.src = "https://sdk.mercadopago.com/js/v2";
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Erro ao carregar Mercado Pago."));
        document.body.appendChild(script);
      });

    async function mountBrick() {
      const publicKey = import.meta.env.VITE_MERCADO_PAGO_PUBLIC_KEY;

      if (!publicKey) {
        onError("Configure VITE_MERCADO_PAGO_PUBLIC_KEY para habilitar cartão.");
        return;
      }

      try {
        await loadScript();
        if (!isMounted || !window.MercadoPago) return;

        if (controllerRef.current?.unmount) {
          controllerRef.current.unmount();
        }

        const mercadoPago = new window.MercadoPago(publicKey, { locale: "pt-BR" });
        const bricksBuilder = mercadoPago.bricks();

        controllerRef.current = await bricksBuilder.create("cardPayment", containerId, {
          initialization: {
            amount,
            payer: {
              email,
            },
          },
          customization: {
            visual: { style: { theme: "dark" } },
            paymentMethods: { maxInstallments: 12 },
          },
          callbacks: {
            onReady: () => {
              console.log("Mercado Pago Card Brick carregado");
            },
            onSubmit: async (cardFormData: any) => {
              await onSubmit({
                token: cardFormData?.token,
                issuer_id: cardFormData?.issuer_id,
                payment_method_id: cardFormData?.payment_method_id,
                installments: Number(cardFormData?.installments ?? 1),
              });
            },
            onError: (error: any) => {
              console.error("Mercado Pago Card Brick error:", error);
              onError("Não foi possível carregar o pagamento com cartão.");
            },
          },
        });
      } catch (error) {
        console.error(error);
        onError(error instanceof Error ? error.message : "Erro ao carregar Mercado Pago.");
      }
    }

    if (!disabled) void mountBrick();

    return () => {
      isMounted = false;
      if (controllerRef.current?.unmount) {
        controllerRef.current.unmount();
      }
    };
  }, [amount, disabled, email, onError, onSubmit]);

  return (
    <div className="mt-5 rounded-3xl border border-border/70 bg-background/35 p-4">
      <div id={containerId} />
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
