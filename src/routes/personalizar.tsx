import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { ProductCard } from "@/components/site/ProductCard";
import { useCatalogProducts } from "@/hooks/useCatalogProducts";

export const Route = createFileRoute("/personalizar")({
  head: () => ({
    meta: [
      { title: "Personalizar luminária — JANGO3D" },
      {
        name: "description",
        content:
          "Crie uma luminária 3D única: nome, cor, tamanho, alimentação e intensidade de luz. Feita à mão sob encomenda.",
      },
    ],
  }),
  component: Personalizar,
});

function PersonalizarSkeleton() {
  return (
    <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="space-y-5">
          <div className="aspect-[4/5] w-full rounded-3xl shimmer" />
          <div className="h-4 w-2/3 rounded-full shimmer" />
          <div className="h-3 w-full max-w-[12rem] rounded-full shimmer" />
        </div>
      ))}
    </div>
  );
}

function Personalizar() {
  const { data: sections = [], isLoading, isError, refetch } = useCatalogProducts();
  const items = sections.flatMap((s) => s.items);

  return (
    <div className="min-h-screen">
      <Header />
      <section className="mx-auto max-w-5xl px-6 pt-20 pb-10 text-center">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Atelier digital</p>
        <h1 className="mt-3 text-balance font-display text-5xl md:text-6xl">Crie a luminária dos sonhos.</h1>
        <p className="mx-auto mt-5 max-w-xl text-muted-foreground">
          Escolha um modelo da coleção como ponto de partida. No próximo passo você define cor, tamanho, alimentação,
          intensidade da luz e adiciona um nome.
        </p>
      </section>
      <section className="mx-auto max-w-7xl px-6 pb-24">
        {isLoading ? <PersonalizarSkeleton /> : null}

        {isError ? (
          <div className="rounded-[2rem] border border-destructive/25 bg-destructive/10 px-8 py-10 text-center">
            <p className="text-sm text-destructive">Erro ao carregar modelos.</p>
            <button
              type="button"
              onClick={() => void refetch()}
              className="mt-4 text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              Tentar novamente
            </button>
          </div>
        ) : null}

        {!isLoading && !isError && items.length === 0 ? (
          <p className="text-center text-muted-foreground">
            Nenhum produto disponível no momento.{" "}
            <Link to="/colecao" className="text-primary underline-offset-4 hover:underline">
              Ver coleção
            </Link>
          </p>
        ) : null}

        {!isLoading && !isError && items.length > 0 ? (
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((p) => (
              <ProductCard
                key={p.id}
                product={{
                  slug: p.slug,
                  name: p.name,
                  tagline: p.description.trim() || "Personalize no próximo passo.",
                  basePrice: p.price,
                  category: p.category || "Coleção",
                  image: p.image,
                }}
              />
            ))}
          </div>
        ) : null}

        <div className="mt-16 rounded-[2rem] bg-gradient-warm p-10 text-center shadow-soft md:p-16">
          <h2 className="font-display text-3xl text-balance md:text-4xl">Quer algo totalmente exclusivo?</h2>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
            Desenhamos peças sob medida para chá de bebê, presentes corporativos e quartinhos temáticos.
          </p>
          <Link
            to="/contato"
            className="mt-6 inline-flex rounded-full bg-foreground px-6 py-3.5 text-sm font-medium text-background hover:bg-foreground/85"
          >
            Falar com o atelier
          </Link>
        </div>
      </section>
      <Footer />
    </div>
  );
}
