import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/lib/cart";
import { toast } from "sonner";
import type { Product } from "@/components/ProductCard";

export const Route = createFileRoute("/product/$id")({
  component: ProductDetail,
});

function ProductDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { add } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [size, setSize] = useState<string>("");
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);

  useEffect(() => {
    supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .maybeSingle()
      .then(({ data }) => {
        const p = data as Product | null;
        setProduct(p);
        if (p?.sizes?.length) setSize(p.sizes[0]);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">Loading...</div>;
  }
  if (!product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6">
        <h1 className="font-display text-3xl">Jersey not found</h1>
        <Link to="/shop" className="mt-4 inline-block text-primary">Back to shop</Link>
      </div>
    );
  }

  const handleAdd = () => {
    if (!size) return toast.error("Pick a size");
    if (product.stock <= 0) return toast.error("Out of stock");
    add({
      productId: product.id,
      name: product.name,
      price: Number(product.price),
      size,
      quantity: qty,
      image: product.images?.[0],
    });
    toast.success("Added to cart");
  };

  const buyNow = () => {
    if (!size) return toast.error("Pick a size");
    add({
      productId: product.id,
      name: product.name,
      price: Number(product.price),
      size,
      quantity: qty,
      image: product.images?.[0],
    });
    navigate({ to: "/checkout" });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Link to="/shop" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to shop
      </Link>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        <div>
          <div className="aspect-square overflow-hidden rounded-lg border border-border bg-muted">
            {product.images?.[activeImg] ? (
              <img src={product.images[activeImg]} alt={product.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">No image</div>
            )}
          </div>
          {product.images?.length > 1 && (
            <div className="mt-4 grid grid-cols-5 gap-2">
              {product.images.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={`aspect-square overflow-hidden rounded border-2 ${i === activeImg ? "border-primary" : "border-border"}`}
                >
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          {product.sport && (
            <p className="text-xs font-bold uppercase tracking-widest text-primary">{product.sport}</p>
          )}
          <h1 className="mt-2 font-display text-5xl leading-none">{product.name}</h1>
          {product.team && <p className="mt-2 text-lg text-muted-foreground">{product.team}</p>}

          <p className="mt-6 font-display text-4xl">₹{Number(product.price).toFixed(0)}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
          </p>

          {product.description && (
            <p className="mt-6 text-foreground/80">{product.description}</p>
          )}

          <div className="mt-8">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest">Size</p>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((s) => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={`min-w-14 rounded-md border-2 px-4 py-2 text-sm font-bold ${
                    size === s ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-foreground"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest">Quantity</p>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="icon" onClick={() => setQty(Math.max(1, qty - 1))}>−</Button>
              <span className="w-10 text-center font-display text-xl">{qty}</span>
              <Button variant="outline" size="icon" onClick={() => setQty(qty + 1)}>+</Button>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Button onClick={handleAdd} disabled={product.stock <= 0} size="lg" variant="outline" className="h-14 flex-1 border-2 text-base font-bold uppercase tracking-wider">
              <ShoppingBag className="mr-2 h-5 w-5" /> Add to cart
            </Button>
            <Button onClick={buyNow} disabled={product.stock <= 0} size="lg" className="h-14 flex-1 bg-gradient-primary text-base font-bold uppercase tracking-wider text-primary-foreground shadow-glow">
              Buy now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
