import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { ProductCard } from "@/components/site/ProductCard";
import { products } from "@/lib/products";

export const Route = createFileRoute("/colecao")({
  head: () => ({
    meta: [
      { title: "Coleção JANGO3D — Luminárias decorativas infantis" },
      { name: "description", content: "Conheça toda a coleção de luminárias 3D JANGO3D: nuvens, luas, estrelas e bichinhos para o quartinho dos sonhos." },
    ],
  }),
  component: Colecao,
});

function Colecao() {
  return (
    <div className="min-h-screen">
      <Header />
      <section className="mx-auto max-w-7xl px-6 pt-16 pb-10">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Coleção completa</p>
        <h1 className="mt-3 font-display text-5xl md:text-6xl text-balance">Luminárias para sonhar acordado.</h1>
        <p className="mt-5 max-w-xl text-muted-foreground">
          Peças impressas sob encomenda, com luz quente regulável e personalização sob medida.
        </p>
      </section>
      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      </section>
      <Footer />
    </div>
  );
}
