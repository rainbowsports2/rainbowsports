import { createServerFn } from "@tanstack/react-start";

export type YouTubeVideo = {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  published: string;
};

const CHANNEL_HANDLE = "rsrainbowsports";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

type CacheEntry = { videos: YouTubeVideo[]; at: number };
let cache: CacheEntry | null = null;

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

/**
 * Scrape the channel's /videos page and pull videoId + title pairs out of the
 * embedded ytInitialData JSON. The public RSS feed (/feeds/videos.xml) often
 * returns 404/500 from server IPs, so we parse the page HTML instead.
 */
function parseChannelHtml(html: string): YouTubeVideo[] {
  const videos: YouTubeVideo[] = [];
  const seen = new Set<string>();

  // Match each videoRenderer block: capture videoId, title text, and published
  const re =
    /"videoId":"([A-Za-z0-9_-]{11})"[\s\S]{0,1500}?"title":\{"runs":\[\{"text":"([^"]+)"\}\][\s\S]{0,400}?(?:"publishedTimeText":\{"simpleText":"([^"]+)"\})?/g;

  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const id = m[1];
    if (seen.has(id)) continue;
    seen.add(id);
    const title = m[2]
      .replace(/\\u0026/g, "&")
      .replace(/\\"/g, '"')
      .replace(/\\\//g, "/");
    const published = m[3] ?? "";
    videos.push({
      id,
      title,
      url: `https://www.youtube.com/watch?v=${id}`,
      thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      published,
    });
    if (videos.length >= 12) break;
  }
  return videos;
}

export const getChannelVideos = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ videos: YouTubeVideo[]; error: string | null }> => {
    // Serve from 24h cache when fresh.
    if (cache && Date.now() - cache.at < CACHE_TTL_MS && cache.videos.length > 0) {
      return { videos: cache.videos, error: null };
    }

    try {
      const res = await fetch(
        `https://www.youtube.com/@${CHANNEL_HANDLE}/videos`,
        {
          headers: {
            "User-Agent": UA,
            "Accept-Language": "en-US,en;q=0.9",
          },
        }
      );

      if (!res.ok) {
        if (cache && cache.videos.length > 0) {
          return { videos: cache.videos, error: null };
        }
        return { videos: [], error: `YouTube returned ${res.status}` };
      }

      const html = await res.text();
      const videos = parseChannelHtml(html);

      if (videos.length === 0) {
        if (cache && cache.videos.length > 0) {
          return { videos: cache.videos, error: null };
        }
        return { videos: [], error: "No videos found on channel." };
      }

      cache = { videos, at: Date.now() };
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
