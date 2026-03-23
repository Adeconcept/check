import { isDirectVideoAsset } from "@/lib/video-url";

export type PlaybackConfig =
  | {
      autoplaySrc: string;
      kind: "video";
      seekStrategy: "native";
      sourceLabel: string;
      sourceUrl: string;
    }
  | {
      autoplaySrc: string;
      kind: "iframe";
      seekStrategy: "query";
      sourceLabel: string;
      sourceUrl: string;
      toSeekSrc: (seconds: number) => string;
    }
  | {
      autoplaySrc: string;
      kind: "external";
      seekStrategy: "none";
      sourceLabel: string;
      sourceUrl: string;
    };

function getYouTubeId(url: URL) {
  if (url.hostname.includes("youtu.be")) {
    return url.pathname.split("/").filter(Boolean)[0] ?? null;
  }

  return url.searchParams.get("v");
}

function getVimeoId(url: URL) {
  const segments = url.pathname.split("/").filter(Boolean);
  const candidate = segments.find((segment) => /^\d+$/.test(segment));
  return candidate ?? null;
}

function getLoomId(url: URL) {
  const segments = url.pathname.split("/").filter(Boolean);
  const anchor = segments.findIndex((segment) => segment === "share" || segment === "embed");

  if (anchor === -1) {
    return segments.at(-1) ?? null;
  }

  return segments[anchor + 1] ?? null;
}

function getGoogleDriveId(url: URL) {
  const segments = url.pathname.split("/").filter(Boolean);
  const fileIndex = segments.findIndex((segment) => segment === "d");
  return fileIndex === -1 ? null : segments[fileIndex + 1] ?? null;
}

function getTikTokId(url: URL) {
  const segments = url.pathname.split("/").filter(Boolean);
  const videoIndex = segments.findIndex((segment) => segment === "video");

  if (videoIndex === -1) {
    return null;
  }

  const candidate = segments[videoIndex + 1] ?? null;

  return candidate && /^\d+$/.test(candidate) ? candidate : null;
}

export function getPlaybackConfig(rawUrl: string): PlaybackConfig {
  const url = new URL(rawUrl);

  if (isDirectVideoAsset(url.pathname)) {
    return {
      autoplaySrc: url.toString(),
      kind: "video",
      seekStrategy: "native",
      sourceLabel: "Direct video",
      sourceUrl: url.toString()
    };
  }

  const youtubeId = getYouTubeId(url);

  if (youtubeId) {
    const toSeekSrc = (seconds: number) =>
      `https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1&start=${Math.max(0, Math.floor(seconds))}`;

    return {
      autoplaySrc: toSeekSrc(0),
      kind: "iframe",
      seekStrategy: "query",
      sourceLabel: "YouTube",
      sourceUrl: url.toString(),
      toSeekSrc
    };
  }

  const vimeoId = getVimeoId(url);

  if (vimeoId && url.hostname.includes("vimeo.com")) {
    const toSeekSrc = (seconds: number) =>
      `https://player.vimeo.com/video/${vimeoId}?autoplay=1#t=${Math.max(0, Math.floor(seconds))}s`;

    return {
      autoplaySrc: toSeekSrc(0),
      kind: "iframe",
      seekStrategy: "query",
      sourceLabel: "Vimeo",
      sourceUrl: url.toString(),
      toSeekSrc
    };
  }

  const loomId = getLoomId(url);

  if (loomId && url.hostname.includes("loom.com")) {
    const toSeekSrc = (seconds: number) =>
      `https://www.loom.com/embed/${loomId}?autoplay=1&muted=0&t=${Math.max(0, Math.floor(seconds))}`;

    return {
      autoplaySrc: toSeekSrc(0),
      kind: "iframe",
      seekStrategy: "query",
      sourceLabel: "Loom",
      sourceUrl: url.toString(),
      toSeekSrc
    };
  }

  const driveId = getGoogleDriveId(url);

  if (driveId && url.hostname.includes("drive.google.com")) {
    const toSeekSrc = () => `https://drive.google.com/file/d/${driveId}/preview`;

    return {
      autoplaySrc: toSeekSrc(),
      kind: "iframe",
      seekStrategy: "query",
      sourceLabel: "Google Drive",
      sourceUrl: url.toString(),
      toSeekSrc
    };
  }

  const tikTokId = getTikTokId(url);

  if (tikTokId && url.hostname.includes("tiktok.com")) {
    const toSeekSrc = () =>
      `https://www.tiktok.com/player/v1/${tikTokId}?autoplay=1&description=0&music_info=0&rel=0&native_context_menu=1`;

    return {
      autoplaySrc: toSeekSrc(),
      kind: "iframe",
      seekStrategy: "query",
      sourceLabel: "TikTok",
      sourceUrl: url.toString(),
      toSeekSrc
    };
  }

  return {
    autoplaySrc: url.toString(),
    kind: "external",
    seekStrategy: "none",
    sourceLabel: url.hostname,
    sourceUrl: url.toString()
  };
}

export function parseTimeRange(range: string) {
  const [startLabel, endLabel] = range.split(" to ").map((value) => value.trim());

  return {
    endSeconds: parseTimestamp(endLabel),
    startSeconds: parseTimestamp(startLabel)
  };
}

function parseTimestamp(value: string) {
  const segments = value.split(":").map((part) => Number.parseInt(part, 10));

  if (segments.some((segment) => !Number.isFinite(segment))) {
    return 0;
  }

  return segments.reduce((total, segment) => total * 60 + segment, 0);
}
