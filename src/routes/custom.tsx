import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { Upload, MessageCircle, X, ImageIcon, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const PRIMARY_WA = "919042953430";
const ALT_WA = "919943295343";

export const Route = createFileRoute("/custom")({
  head: () => ({
    meta: [
      { title: "Custom Jersey Designs — Rainbow Sports" },
      { name: "description", content: "Send us your custom jersey design on WhatsApp. Personalized team kits, names, numbers and logos." },
      { property: "og:title", content: "Custom Jersey Designs — Rainbow Sports" },
      { property: "og:description", content: "Get your own custom team jersey designed and delivered. Chat with us on WhatsApp." },
    ],
  }),
  component: CustomDesigns,
});

function CustomDesigns() {
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [name, setName] = useState("");
  const [team, setTeam] = useState("");
  const [qty, setQty] = useState("");
  const [notes, setNotes] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const onFile = (f: File | undefined) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) return toast.error("Please pick an image file");
    if (f.size > 8 * 1024 * 1024) return toast.error("Max 8 MB");
    setFileName(f.name);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(f);
  };

  const buildMessage = () => {
    const lines = [
      "Hi Rainbow Sports! I'd like a custom jersey design.",
      name && `Name: ${name}`,
      team && `Team: ${team}`,
      qty && `Quantity: ${qty}`,
      notes && `Notes: ${notes}`,
      preview ? "(I'll attach my design image in this chat)" : "",
    ].filter(Boolean);
    return encodeURIComponent(lines.join("\n"));
  };

  const openWhatsApp = (number: string) => {
    if (!preview && !name && !team && !notes) {
      toast.message("Tip: add details or pick a design first for a quicker reply");
    }
    window.open(`https://wa.me/${number}?text=${buildMessage()}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary">
          <Sparkles className="h-3.5 w-3.5" /> Custom Designs
        </div>
        <h1 className="mt-4 font-display text-5xl leading-none sm:text-6xl">
          DESIGN YOUR <span className="text-primary">OWN JERSEY</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
          Upload a sketch, photo or reference. Send it straight to us on WhatsApp and our team
          will quote, refine and deliver your custom kit.
        </p>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Upload / Preview */}
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">Your design</p>
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              onFile(e.dataTransfer.files?.[0]);
            }}
            className="relative aspect-square overflow-hidden rounded-lg border-2 border-dashed border-border bg-card transition-colors hover:border-primary"
          >
            {preview ? (
              <>
                <img src={preview} alt="Your custom jersey design preview" className="h-full w-full object-contain" />
                <button
                  onClick={() => { setPreview(null); setFileName(""); if (fileRef.current) fileRef.current.value = ""; }}
                  className="absolute right-3 top-3 rounded-full bg-background/90 p-2 shadow-md hover:bg-background"
                  aria-label="Remove image"
                >
                  <X className="h-4 w-4" />
                </button>
              </>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                className="flex h-full w-full flex-col items-center justify-center gap-3 text-muted-foreground"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <ImageIcon className="h-7 w-7" />
                </div>
                <p className="font-bold uppercase tracking-wider">Drop image here</p>
                <p className="text-xs">or click to browse · max 8 MB</p>
              </button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0])}
          />
          {fileName && <p className="mt-2 truncate text-xs text-muted-foreground">Selected: {fileName}</p>}
          {!preview && (
            <Button onClick={() => fileRef.current?.click()} variant="outline" className="mt-3 w-full border-2">
              <Upload className="mr-2 h-4 w-4" /> Choose image
            </Button>
          )}

          <div className="mt-6 rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
            <p className="font-bold text-foreground">Heads up</p>
            <p className="mt-1">
              The image preview here is just for you. After clicking the WhatsApp button, please
              attach the same image inside the WhatsApp chat — that's the fastest way for our team
              to receive your design.
            </p>
          </div>
        </div>

        {/* Details + WhatsApp */}
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">Details (optional)</p>
          <div className="space-y-3">
            <Input placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
            <Input placeholder="Team / club name" value={team} onChange={(e) => setTeam(e.target.value)} />
            <Input placeholder="Quantity (e.g. 11 jerseys)" value={qty} onChange={(e) => setQty(e.target.value)} inputMode="numeric" />
            <Textarea
              placeholder="Notes — colors, sizes, names & numbers, deadline…"
              rows={5}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="mt-6 space-y-3">
            <Button
              onClick={() => openWhatsApp(PRIMARY_WA)}
              size="lg"
              className="h-14 w-full bg-[#25D366] text-base font-bold uppercase tracking-wider text-white shadow-glow hover:bg-[#1faa53]"
            >
              <MessageCircle className="mr-2 h-5 w-5" /> Send on WhatsApp · 90429 53430
            </Button>
            <Button
              onClick={() => openWhatsApp(ALT_WA)}
              variant="outline"
              size="lg"
              className="h-12 w-full border-2 text-sm font-bold uppercase tracking-wider"
            >
              <MessageCircle className="mr-2 h-4 w-4" /> Or chat: 99432 95343
            </Button>
          </div>

          <ol className="mt-8 space-y-3 text-sm">
            {[
              "Pick or drop your design image",
              "Add optional details (team, quantity, notes)",
              "Tap WhatsApp — message opens prefilled",
              "Attach the same image in WhatsApp & send",
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {i + 1}
                </span>
                <span className="text-muted-foreground">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
