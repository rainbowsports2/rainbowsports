import { Link } from "@tanstack/react-router";

export type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  sport: string | null;
  team: string | null;
  sizes: string[];
  stock: number;
  images: string[];
  is_active: boolean;
};

export function ProductCard({ product }: { product: Product }) {
  const img = product.images?.[0];
  return (
    <Link
      to="/product/$id"
      params={{ id: product.id }}
      className="group block overflow-hidden rounded-lg border border-border bg-card transition-all hover:border-primary hover:shadow-glow"
    >
      <div className="aspect-square overflow-hidden bg-muted">
        {img ? (
          <img
            src={img}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            No image
          </div>
        )}
      </div>
      <div className="p-4">
        <p className="text-xs font-bold uppercase tracking-widest text-primary">
          {product.sport || "Jersey"}
        </p>
        <h3 className="mt-1 font-display text-xl tracking-wide">{product.name}</h3>
        {product.team && <p className="text-sm text-muted-foreground">{product.team}</p>}
        <p className="mt-3 font-display text-2xl">₹{Number(product.price).toFixed(0)}</p>
      </div>
    </Link>
  );
}
