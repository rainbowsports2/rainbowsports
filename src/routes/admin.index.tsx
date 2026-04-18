import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Product } from "@/components/ProductCard";

export const Route = createFileRoute("/admin/")({
  component: AdminProducts,
});

const empty = {
  id: "",
  name: "",
  description: "",
  price: 0,
  sport: "",
  team: "",
  sizes: ["S", "M", "L", "XL"],
  stock: 0,
  images: [] as string[],
  is_active: true,
};

function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<typeof empty>(empty);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    setProducts((data ?? []) as Product[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing({ ...empty }); setOpen(true); };
  const openEdit = (p: Product) => {
    setEditing({
      id: p.id,
      name: p.name,
      description: p.description ?? "",
      price: Number(p.price),
      sport: p.sport ?? "",
      team: p.team ?? "",
      sizes: p.sizes,
      stock: p.stock,
      images: p.images ?? [],
      is_active: p.is_active,
    });
    setOpen(true);
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop();
        const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from("product-images").upload(path, file);
        if (error) throw error;
        const { data } = supabase.storage.from("product-images").getPublicUrl(path);
        urls.push(data.publicUrl);
      }
      setEditing((e) => ({ ...e, images: [...e.images, ...urls] }));
      toast.success(`${urls.length} image(s) uploaded`);
    } catch (e: any) {
      toast.error(e?.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (url: string) =>
    setEditing((e) => ({ ...e, images: e.images.filter((u) => u !== url) }));

  const save = async () => {
    if (!editing.name || editing.price <= 0) {
      toast.error("Name and price are required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: editing.name,
        description: editing.description || null,
        price: editing.price,
        sport: editing.sport || null,
        team: editing.team || null,
        sizes: editing.sizes,
        stock: editing.stock,
        images: editing.images,
        is_active: editing.is_active,
      };
      if (editing.id) {
        const { error } = await supabase.from("products").update(payload).eq("id", editing.id);
        if (error) throw error;
        toast.success("Updated");
      } else {
        const { error } = await supabase.from("products").insert(payload);
        if (error) throw error;
        toast.success("Created");
      }
      setOpen(false);
      load();
    } catch (e: any) {
      toast.error(e?.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    load();
  };

  return (
    <div>
      <div className="mb-6 flex justify-between">
        <h2 className="font-display text-3xl">PRODUCTS</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew} className="bg-gradient-primary font-bold uppercase tracking-wider text-primary-foreground shadow-glow">
              <Plus className="mr-2 h-4 w-4" /> New jersey
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display text-2xl">
                {editing.id ? "EDIT JERSEY" : "NEW JERSEY"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label>Name *</Label>
                <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Sport</Label>
                  <Input value={editing.sport} onChange={(e) => setEditing({ ...editing, sport: e.target.value })} placeholder="Football, Basketball..." />
                </div>
                <div>
                  <Label>Team</Label>
                  <Input value={editing.team} onChange={(e) => setEditing({ ...editing, team: e.target.value })} placeholder="Manchester United..." />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Price (₹) *</Label>
                  <Input type="number" min={0} value={editing.price} onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })} />
                </div>
                <div>
                  <Label>Stock</Label>
                  <Input type="number" min={0} value={editing.stock} onChange={(e) => setEditing({ ...editing, stock: Number(e.target.value) })} />
                </div>
              </div>

              <div>
                <Label>Sizes (comma separated)</Label>
                <Input
                  value={editing.sizes.join(", ")}
                  onChange={(e) => setEditing({ ...editing, sizes: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
                />
              </div>

              <div>
                <Label>Description</Label>
                <Textarea rows={3} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
              </div>

              <div>
                <Label>Images</Label>
                <div className="mt-2 grid grid-cols-4 gap-2">
                  {editing.images.map((url) => (
                    <div key={url} className="group relative aspect-square overflow-hidden rounded border border-border">
                      <img src={url} alt="" className="h-full w-full object-cover" />
                      <button
                        onClick={() => removeImage(url)}
                        className="absolute right-1 top-1 rounded-full bg-destructive p-1 opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <X className="h-3 w-3 text-destructive-foreground" />
                      </button>
                    </div>
                  ))}
                  <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded border-2 border-dashed border-border text-xs text-muted-foreground hover:border-primary hover:text-foreground">
                    <Upload className="h-5 w-5" />
                    {uploading ? "..." : "Upload"}
                    <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleUpload(e.target.files)} />
                  </label>
                </div>
              </div>

              <label className="flex items-center gap-2">
                <input type="checkbox" checked={editing.is_active} onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} />
                <span className="text-sm">Active (visible in shop)</span>
              </label>

              <Button onClick={save} disabled={saving} size="lg" className="w-full bg-gradient-primary font-bold uppercase tracking-wider text-primary-foreground shadow-glow">
                {saving ? "Saving..." : editing.id ? "Update" : "Create"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : products.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-16 text-center">
          <p className="text-muted-foreground">No products yet. Click "New jersey" to add one.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-card text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="p-3 text-left">Image</th>
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Sport</th>
                <th className="p-3 text-right">Price</th>
                <th className="p-3 text-right">Stock</th>
                <th className="p-3 text-center">Active</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="p-2">
                    <div className="h-12 w-12 overflow-hidden rounded bg-muted">
                      {p.images?.[0] && <img src={p.images[0]} alt="" className="h-full w-full object-cover" />}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="font-bold">{p.name}</div>
                    {p.team && <div className="text-xs text-muted-foreground">{p.team}</div>}
                  </td>
                  <td className="p-3 text-muted-foreground">{p.sport ?? "—"}</td>
                  <td className="p-3 text-right">₹{Number(p.price).toFixed(0)}</td>
                  <td className="p-3 text-right">{p.stock}</td>
                  <td className="p-3 text-center">{p.is_active ? "✓" : "—"}</td>
                  <td className="p-3 text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => remove(p.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
