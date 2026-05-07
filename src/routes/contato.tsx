import { createFileRoute } from "@tanstack/react-router";
import { Instagram, Mail, MessageCircle } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";

export const Route = createFileRoute("/contato")({
  head: () => ({
    meta: [
      { title: "Contato — JANGO3D" },
      { name: "description", content: "Fale com o atelier JANGO3D. Encomendas personalizadas, parcerias e atendimento humano." },
    ],
  }),
  component: Contato,
});

function Contato() {
  return (
    <div className="min-h-screen">
      <Header />
      <section className="mx-auto max-w-5xl px-6 pt-20 pb-24">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Atelier</p>
        <h1 className="mt-3 font-display text-5xl md:text-6xl text-balance">Vamos conversar.</h1>
        <p className="mt-5 max-w-xl text-muted-foreground">
          Encomendas especiais, presentes corporativos ou só uma dúvida? Escreva pra gente —
          respondemos com carinho em até 24h úteis.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            { Icon: Mail, t: "E-mail", d: "ola@jango3d.com.br" },
            { Icon: MessageCircle, t: "WhatsApp", d: "(11) 9 9999-9999" },
            { Icon: Instagram, t: "Instagram", d: "@jango3d" },
          ].map((c) => (
            <div key={c.t} className="rounded-3xl border border-border/60 bg-cream p-8">
              <c.Icon className="h-5 w-5 text-primary" />
              <p className="mt-4 font-display text-xl">{c.t}</p>
              <p className="mt-1 text-sm text-muted-foreground">{c.d}</p>
            </div>
          ))}
        </div>

        <form className="mt-16 grid gap-5 rounded-[2rem] bg-gradient-warm p-8 shadow-soft md:p-12">
          <div className="grid gap-5 md:grid-cols-2">
            <Input label="Seu nome" placeholder="Como podemos te chamar?" />
            <Input label="E-mail" type="email" placeholder="você@email.com" />
          </div>
          <div>
            <label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Mensagem</label>
            <textarea rows={5} placeholder="Conte um pouco sobre sua ideia..." className="mt-2 w-full rounded-3xl border border-border bg-background px-5 py-4 text-sm outline-none focus:border-foreground" />
          </div>
          <button type="button" className="mt-2 self-start rounded-full bg-foreground px-6 py-3.5 text-sm font-medium text-background hover:bg-foreground/85">
            Enviar mensagem
          </button>
        </form>
      </section>
      <Footer />
    </div>
  );
}

function Input({ label, ...rest }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <div>
      <label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{label}</label>
      <input {...rest} className="mt-2 w-full rounded-full border border-border bg-background px-5 py-3 text-sm outline-none focus:border-foreground" />
    </div>
  );
}
