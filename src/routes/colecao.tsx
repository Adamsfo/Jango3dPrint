import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { ProductCard } from "@/components/site/ProductCard";
import { useCatalogProducts } from "@/hooks/useCatalogProducts";

export const Route = createFileRoute("/colecao")({
  head: () => ({
    meta: [
      { title: "Coleção JANGO3D — Luminárias decorativas infantis" },
      {
        name: "description",
        content:
          "Conheça toda a coleção de luminárias 3D JANGO3D: nuvens, luas, estrelas e bichinhos para o quartinho dos sonhos.",
      },
    ],
  }),
  component: Colecao,
});

function ColecaoSkeleton() {
  return (
    <div className="space-y-20">
      {[0, 1, 2].map((section) => (
        <div key={section}>
          <div className="mb-10 h-10 w-52 max-w-full rounded-2xl shimmer" />
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="space-y-5">
                <div className="aspect-[4/5] w-full rounded-3xl shimmer" />
                <div className="h-4 w-2/3 rounded-full shimmer" />
                <div className="h-3 w-full max-w-[14rem] rounded-full shimmer" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function Colecao() {
  const { data: sections = [], isLoading, isError, refetch } = useCatalogProducts();

  return (
    <div className="min-h-screen">
      <Header />
      <section className="mx-auto max-w-7xl px-6 pt-16 pb-10">
        <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Coleção completa</p>
        <h1 className="mt-3 text-balance font-display text-5xl md:text-6xl">
          Luminárias para sonhar acordado.
        </h1>
        <p className="mt-5 max-w-xl text-muted-foreground">
          Peças impressas sob encomenda, com luz quente regulável e personalização sob medida — organizadas por
          categoria.
        </p>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-24">
        {isLoading ? <ColecaoSkeleton /> : null}

        {isError ? (
          <div className="rounded-[2rem] border border-destructive/25 bg-destructive/10 px-8 py-12 text-center">
            <p className="font-display text-xl text-foreground">Não foi possível carregar a coleção.</p>
            <p className="mt-3 text-sm text-muted-foreground">Confira sua conexão ou tente novamente em instantes.</p>
            <button
              type="button"
              onClick={() => void refetch()}
              className="mt-8 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-glow cinematic hover:-translate-y-0.5 hover:bg-primary/90"
            >
              Tentar de novo
            </button>
          </div>
        ) : null}

        {!isLoading && !isError && sections.length === 0 ? (
          <div className="grid min-h-[40vh] place-items-center rounded-[2rem] border border-border/70 bg-card/20 px-8 py-16 text-center shadow-soft glass">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Coleção</p>
              <h2 className="mt-4 font-display text-3xl text-balance md:text-4xl">
                Novidades chegando em breve.
              </h2>
              <p className="mx-auto mt-4 max-w-md text-muted-foreground">
                Ainda não há produtos ativos cadastrados. Volte mais tarde ou fale com a gente no atelier.
              </p>
              <Link
                to="/contato"
                className="mt-8 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-glow cinematic hover:-translate-y-0.5"
              >
                Falar com o atelier
              </Link>
            </div>
          </div>
        ) : null}

        {!isLoading && !isError && sections.length > 0 ? (
          <div className="space-y-20">
            {sections.map(({ category, items }) => (
              <div key={category}>
                <div className="mb-10 flex flex-wrap items-end justify-between gap-4 border-b border-border/60 pb-4">
                  <h2 className="font-display text-3xl tracking-tight text-balance md:text-4xl">{category}</h2>
                  <span className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                    {items.length} {items.length === 1 ? "peça" : "peças"}
                  </span>
                </div>
                <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((p) => (
                    <ProductCard
                      key={p.id}
                      product={{
                        slug: p.slug,
                        name: p.name,
                        tagline: p.description.trim() || "Detalhes na página do produto.",
                        basePrice: p.price,
                        category: category,
                        image: p.image,
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </section>
      <Footer />
    </div>
  );
}
