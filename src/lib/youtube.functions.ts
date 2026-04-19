import { createServerFn } from "@tanstack/react-start";

export type YouTubeVideo = {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  published: string;
};

const CHANNEL_HANDLE = "rsrainbowsports";
// Known channel ID for @rsrainbowsports — used as fallback if resolution fails.
const FALLBACK_CHANNEL_ID = "UCOeO4lIwyDxMbW4YFq1J8eg";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

type CacheEntry = { videos: YouTubeVideo[]; error: string | null; at: number };
let cache: CacheEntry | null = null;

const UA =
  "Mozilla/5.0 (compatible; LovableBot/1.0; +https://lovable.dev)";

async function resolveChannelId(): Promise<string | null> {
  try {
    const res = await fetch(`https://www.youtube.com/@${CHANNEL_HANDLE}`, {
      headers: { "User-Agent": UA },
    });
    if (!res.ok) return null;
    const html = await res.text();
    const m =
      html.match(/"channelId":"(UC[A-Za-z0-9_-]{20,})"/) ||
      html.match(/"externalId":"(UC[A-Za-z0-9_-]{20,})"/) ||
      html.match(/channel\/(UC[A-Za-z0-9_-]{20,})/);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

function parseFeed(xml: string): YouTubeVideo[] {
  const entries = xml.split("<entry>").slice(1);
  const videos: YouTubeVideo[] = [];
  for (const e of entries) {
    const id = e.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1];
    const title = e.match(/<title>([^<]+)<\/title>/)?.[1];
    const published = e.match(/<published>([^<]+)<\/published>/)?.[1];
    if (!id || !title) continue;
    videos.push({
      id,
      title: title
        .replace(/&amp;/g, "&")
        .replace(/&#39;/g, "'")
        .replace(/&quot;/g, '"'),
      url: `https://www.youtube.com/watch?v=${id}`,
      thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      published: published ?? "",
    });
  }
  return videos;
}

export const getChannelVideos = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ videos: YouTubeVideo[]; error: string | null }> => {
    // Serve from 24h cache when fresh.
    if (cache && Date.now() - cache.at < CACHE_TTL_MS && cache.videos.length > 0) {
      return { videos: cache.videos, error: cache.error };
    }

    try {
      const channelId = (await resolveChannelId()) ?? FALLBACK_CHANNEL_ID;
      const res = await fetch(
        `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`,
        { headers: { "User-Agent": UA } }
      );
      if (!res.ok) {
        const err = `YouTube feed error (${res.status})`;
        // If we have a stale cache, return it instead of failing.
        if (cache && cache.videos.length > 0) {
          return { videos: cache.videos, error: null };
        }
        return { videos: [], error: err };
      }
      const xml = await res.text();
      const videos = parseFeed(xml).slice(0, 12);
      cache = { videos, error: null, at: Date.now() };
      return { videos, error: null };
    } catch (err) {
      console.error("YouTube fetch failed:", err);
      if (cache && cache.videos.length > 0) {
        return { videos: cache.videos, error: null };
      }
      return { videos: [], error: "Unable to load videos right now." };
    }
  }
);
