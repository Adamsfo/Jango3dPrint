import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import process from "@/assets/process.jpg";

export const Route = createFileRoute("/sobre")({
  head: () => ({
    meta: [
      { title: "Sobre a JANGO3D — Luminárias artesanais em 3D" },
      { name: "description", content: "Somos um atelier brasileiro de luminárias decorativas infantis. Cada peça é impressa à mão com carinho para iluminar os primeiros sonhos." },
    ],
  }),
  component: Sobre,
});

function Sobre() {
  return (
    <div className="min-h-screen">
      <Header />
      <section className="mx-auto max-w-4xl px-6 pt-20 pb-12 text-center">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Nossa história</p>
        <h1 className="mt-3 font-display text-5xl md:text-6xl text-balance">
          Pequenas luzes, grandes memórias.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground">
          A JANGO3D nasceu no quartinho da nossa filha. Buscávamos uma luz quente,
          delicada e diferente — e quando não encontramos, decidimos criar.
          Hoje, cada luminária é impressa camada por camada, à mão, para acolher famílias por todo o Brasil.
        </p>
      </section>
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="overflow-hidden rounded-[2rem] shadow-soft">
          <img src={process} alt="Atelier JANGO3D" className="h-full w-full object-cover" />
        </div>
        <div className="mt-16 grid gap-10 md:grid-cols-3">
          {[
            { t: "Artesanal", d: "Cada peça é impressa sob encomenda e finalizada à mão." },
            { t: "Sustentável", d: "Materiais PLA de origem vegetal e produção sem desperdício." },
            { t: "Atemporal", d: "Design minimalista para acompanhar a infância e além." },
          ].map((b) => (
            <div key={b.t}>
              <h3 className="font-display text-2xl">{b.t}</h3>
              <p className="mt-3 text-muted-foreground">{b.d}</p>
            </div>
          ))}
        </div>
      </section>
      <Footer />
    </div>
  );
}
