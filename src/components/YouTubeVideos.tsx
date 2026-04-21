import { ArrowRight, Play, Youtube } from "lucide-react";
import { Button } from "@/components/ui/button";

export function YouTubeVideos() {
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

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="rounded-lg border border-border bg-card p-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Play className="ml-1 h-7 w-7 fill-current" />
            </div>
            <h3 className="mt-6 font-display text-4xl">WATCH THE LATEST DROPS</h3>
            <p className="mt-4 max-w-2xl text-muted-foreground">
              See new jersey arrivals, print samples, and custom kit updates directly on the Rainbow Sports channel.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="https://www.youtube.com/@rsrainbowsports" target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="h-12 bg-gradient-primary px-6 font-bold uppercase tracking-wider text-primary-foreground shadow-glow">
                  Open channel <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </a>
              <a href="https://www.youtube.com/@rsrainbowsports/videos" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="lg" className="h-12 px-6 font-bold uppercase tracking-wider">
                  Browse videos
                </Button>
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-1">
            {[
              "Latest jersey arrivals",
              "Custom print samples",
              "Behind-the-scenes updates",
            ].map((item) => (
              <a
                key={item}
                href="https://www.youtube.com/@rsrainbowsports"
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-28 items-center gap-4 rounded-lg border border-border bg-background/60 p-5 transition-colors hover:border-primary"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Youtube className="h-5 w-5" />
                </div>
                <p className="text-sm font-bold uppercase tracking-wider">{item}</p>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
