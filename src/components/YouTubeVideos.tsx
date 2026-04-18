import { useEffect, useState } from "react";
import { Play, Youtube } from "lucide-react";
import { getChannelVideos, type YouTubeVideo } from "@/lib/youtube.functions";

export function YouTubeVideos() {
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getChannelVideos()
      .then((res) => {
        setVideos(res.videos);
        setError(res.error);
      })
      .catch(() => setError("Unable to load videos."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="border-t border-border bg-card/20">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
              <Youtube className="h-4 w-4" /> From the channel
            </p>
            <h2 className="mt-2 font-display text-5xl">RAINBOW SPORTS TV</h2>
          </div>
          <a
            href="https://www.youtube.com/@rsrainbowsports"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden text-sm font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground sm:block"
          >
            Visit channel →
          </a>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-video animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : error || videos.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-12 text-center">
            <p className="text-muted-foreground">{error ?? "No videos available."}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {videos.slice(0, 8).map((v) => (
              <a
                key={v.id}
                href={v.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group block overflow-hidden rounded-lg border border-border bg-card transition-all hover:border-primary hover:shadow-glow"
              >
                <div className="relative aspect-video overflow-hidden bg-muted">
                  <img
                    src={v.thumbnail}
                    alt={v.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-background/40 opacity-0 transition-opacity group-hover:opacity-100">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-glow">
                      <Play className="ml-1 h-6 w-6 fill-current" />
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <p className="line-clamp-2 text-sm font-bold leading-snug">{v.title}</p>
                  {v.published && (
                    <p className="mt-2 text-xs uppercase tracking-wider text-muted-foreground">
                      {new Date(v.published).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  )}
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
