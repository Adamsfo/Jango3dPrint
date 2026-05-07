import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { ProductCard } from "@/components/site/ProductCard";
import { products } from "@/lib/products";

export const Route = createFileRoute("/personalizar")({
  head: () => ({
    meta: [
      { title: "Personalizar luminária — JANGO3D" },
      { name: "description", content: "Crie uma luminária 3D única: nome, cor, tamanho, alimentação e intensidade de luz. Feita à mão sob encomenda." },
    ],
  }),
  component: Personalizar,
});

function Personalizar() {
  return (
    <div className="min-h-screen">
      <Header />
      <section className="mx-auto max-w-5xl px-6 pt-20 pb-10 text-center">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Atelier digital</p>
        <h1 className="mt-3 font-display text-5xl md:text-6xl text-balance">Crie a luminária dos sonhos.</h1>
        <p className="mx-auto mt-5 max-w-xl text-muted-foreground">
          Escolha um modelo da coleção como ponto de partida. No próximo passo você define cor, tamanho, alimentação,
          intensidade da luz e adiciona um nome.
        </p>
      </section>
      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
        <div className="mt-16 rounded-[2rem] bg-gradient-warm p-10 text-center shadow-soft md:p-16">
          <h2 className="font-display text-3xl md:text-4xl text-balance">Quer algo totalmente exclusivo?</h2>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
            Desenhamos peças sob medida para chá de bebê, presentes corporativos e quartinhos temáticos.
          </p>
          <Link to="/contato" className="mt-6 inline-flex rounded-full bg-foreground px-6 py-3.5 text-sm font-medium text-background hover:bg-foreground/85">
            Falar com o atelier
          </Link>
        </div>
      </section>
      <Footer />
    </div>
  );
}
