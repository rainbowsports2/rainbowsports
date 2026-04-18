import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Truck, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import heroImg from "@/assets/hero-jerseys.jpg";
import { ProductCard, type Product } from "@/components/ProductCard";
import { YouTubeVideos } from "@/components/YouTubeVideos";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "JerseyHub — Premium Sports Jerseys, COD Available" },
      { name: "description", content: "Shop authentic football, basketball and cricket jerseys with Cash on Delivery." },
    ],
  }),
  component: Index,
});

function Index() {
  const [featured, setFeatured] = useState<Product[]>([]);

  useEffect(() => {
    supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(4)
      .then(({ data }) => setFeatured((data ?? []) as Product[]));
  }, []);

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImg} alt="Sports jerseys" className="h-full w-full object-cover opacity-60" width={1600} height={1024} />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        </div>
        <div className="relative mx-auto flex min-h-[80vh] max-w-7xl flex-col justify-center px-4 py-20 sm:px-6">
          <p className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary">
            <Zap className="h-3 w-3" /> New season drops
          </p>
          <h1 className="max-w-3xl font-display text-6xl leading-none sm:text-7xl md:text-8xl lg:text-9xl">
            WEAR THE <span className="text-primary">GAME</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            Authentic sports jerseys for every fan. Football, basketball, cricket — pick your team, own the pitch.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link to="/shop">
              <Button size="lg" className="group h-14 bg-gradient-primary px-8 text-base font-bold uppercase tracking-wider text-primary-foreground shadow-glow hover:opacity-90">
                Shop now <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link to="/shop">
              <Button size="lg" variant="outline" className="h-14 border-2 px-8 text-base font-bold uppercase tracking-wider">
                Browse catalog
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="border-y border-border bg-card/30">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-12 sm:grid-cols-3 sm:px-6">
          {[
            { icon: Truck, title: "Cash on Delivery", desc: "Pay when it arrives" },
            { icon: Shield, title: "Authentic gear", desc: "100% original jerseys" },
            { icon: Zap, title: "Fast shipping", desc: "Across India in 3–7 days" },
          ].map((f, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <f.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="font-display text-xl">{f.title}</p>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURED */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary">Latest drops</p>
            <h2 className="mt-2 font-display text-5xl">FEATURED JERSEYS</h2>
          </div>
          <Link to="/shop" className="hidden text-sm font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground sm:block">
            View all →
          </Link>
        </div>
        {featured.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-16 text-center">
            <p className="text-muted-foreground">No jerseys yet. Admins can add products from the Admin panel.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>

      {/* YOUTUBE */}
      <YouTubeVideos />
    </div>
  );
}
