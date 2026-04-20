import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard, type Product } from "@/components/ProductCard";
import { Input } from "@/components/ui/input";
import { BackendUnavailableNotice } from "@/components/BackendUnavailableNotice";
import { isBackendConfigured } from "@/lib/backend";

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "Shop Jerseys — Rainbow Sports" },
      { name: "description", content: "Browse all sports jerseys. Football, basketball, cricket and more." },
    ],
  }),
  component: Shop,
});

function Shop() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sport, setSport] = useState<string>("all");

  useEffect(() => {
    if (!isBackendConfigured) {
      setLoading(false);
      return;
    }

    void supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setProducts((data ?? []) as Product[]);
        setLoading(false);
      });
  }, []);

  const sports = useMemo(() => {
    const s = new Set<string>();
    products.forEach((p) => p.sport && s.add(p.sport));
    return Array.from(s);
  }, [products]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (sport !== "all" && p.sport !== sport) return false;
      if (search && !`${p.name} ${p.team ?? ""}`.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [products, search, sport]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-widest text-primary">Catalog</p>
        <h1 className="mt-2 font-display text-5xl">ALL JERSEYS</h1>
      </div>

      {!isBackendConfigured ? (
        <BackendUnavailableNotice title="Shop unavailable on this deploy" />
      ) : (
        <>
          <div className="mb-8 flex flex-col gap-4 sm:flex-row">
            <Input
              placeholder="Search jerseys, teams..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="sm:max-w-sm"
            />
            <div className="flex flex-wrap gap-2">
              <FilterChip active={sport === "all"} onClick={() => setSport("all")}>All</FilterChip>
              {sports.map((s) => (
                <FilterChip key={s} active={sport === s} onClick={() => setSport(s)}>{s}</FilterChip>
              ))}
            </div>
          </div>

          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : filtered.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-16 text-center">
              <p className="text-muted-foreground">No jerseys match your filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
