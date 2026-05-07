import { Link } from "@tanstack/react-router";
import { type Product, formatBRL } from "@/lib/products";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      to="/produto/$slug"
      params={{ slug: product.slug }}
      className="group block"
    >
      <div className="relative overflow-hidden rounded-3xl bg-gradient-warm shadow-soft">
        <div className="aspect-[4/5] w-full">
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        </div>
        <div className="pointer-events-none absolute inset-x-6 bottom-6 flex items-end justify-between text-sm">
          <span className="rounded-full bg-background/85 px-3 py-1 text-[11px] uppercase tracking-widest text-muted-foreground backdrop-blur">
            {product.category}
          </span>
        </div>
      </div>
      <div className="mt-5 flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-lg">{product.name}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{product.tagline}</p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">A partir de</p>
          <p className="font-display text-lg">{formatBRL(product.basePrice)}</p>
        </div>
      </div>
    </Link>
  );
}
