import { createServerFn } from "@tanstack/react-start";

export type YouTubeVideo = {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  published: string;
};

const CHANNEL_HANDLE = "rsrainbowsports";

async function resolveChannelId(): Promise<string | null> {
  try {
    const res = await fetch(`https://www.youtube.com/@${CHANNEL_HANDLE}`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; LovableBot/1.0; +https://lovable.dev)",
      },
    });
    if (!res.ok) return null;
    const html = await res.text();
    const m =
      html.match(/"channelId":"(UC[\w-]{20,})"/) ||
      html.match(/<meta itemprop="identifier" content="(UC[\w-]{20,})">/) ||
      html.match(/channel\/(UC[\w-]{20,})/);
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
      title: title.replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"'),
      url: `https://www.youtube.com/watch?v=${id}`,
      thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      published: published ?? "",
    });
  }
  return videos;
}

export const getChannelVideos = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ videos: YouTubeVideo[]; error: string | null }> => {
    try {
      const channelId = await resolveChannelId();
      if (!channelId) {
        return { videos: [], error: "Could not resolve YouTube channel." };
      }
      const res = await fetch(
        `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`,
        {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (compatible; LovableBot/1.0; +https://lovable.dev)",
          },
        }
      );
      if (!res.ok) {
        return { videos: [], error: `YouTube feed error (${res.status})` };
      }
      const xml = await res.text();
      const videos = parseFeed(xml).slice(0, 12);
      return { videos, error: null };
    } catch (err) {
      console.error("YouTube fetch failed:", err);
      return { videos: [], error: "Unable to load videos right now." };
    }
  }
);
