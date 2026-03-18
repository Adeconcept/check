import { NextRequest, NextResponse } from "next/server";

const MAX_URL_LENGTH = 2048;
const VIDEO_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtu.be",
  "vimeo.com",
  "www.vimeo.com",
  "tiktok.com",
  "www.tiktok.com",
  "x.com",
  "www.x.com",
  "twitter.com",
  "www.twitter.com",
  "instagram.com",
  "www.instagram.com",
  "facebook.com",
  "www.facebook.com",
  "loom.com",
  "www.loom.com",
  "twitch.tv",
  "www.twitch.tv",
  "drive.google.com"
]);

const DIRECT_VIDEO_EXTENSIONS = [".mp4", ".mov", ".m4v", ".webm", ".avi", ".mkv"];

function sanitizeVideoUrlCandidate(value: string) {
  return value.replace(/[\u0000-\u001f\u007f]+/g, "").trim().slice(0, MAX_URL_LENGTH);
}

function isDirectVideoAsset(pathname: string) {
  const lowerPath = pathname.toLowerCase();
  return DIRECT_VIDEO_EXTENSIONS.some((extension) => lowerPath.endsWith(extension));
}

function validateVideoUrl(value: string) {
  const sanitized = sanitizeVideoUrlCandidate(value);

  if (!sanitized || sanitized.length >= MAX_URL_LENGTH) {
    return null;
  }

  let parsed: URL;

  try {
    parsed = new URL(sanitized);
  } catch {
    return null;
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    return null;
  }

  if (parsed.username || parsed.password || !parsed.hostname || parsed.hostname.length > 253) {
    return null;
  }

  if (!VIDEO_HOSTS.has(parsed.hostname.toLowerCase()) && !isDirectVideoAsset(parsed.pathname)) {
    return null;
  }

  return parsed;
}

function fileNameFromUrl(url: URL) {
  const lastSegment = url.pathname.split("/").filter(Boolean).pop();
  return lastSegment ? decodeURIComponent(lastSegment) : url.hostname;
}

function formatFileSize(contentLength: string | null) {
  const size = Number(contentLength);

  if (!Number.isFinite(size) || size <= 0) {
    return "Size unavailable";
  }

  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function placeholderThumbnail(title: string) {
  const safeTitle = title.replace(/[<>&"]/g, "");
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
      <defs>
        <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#4b3c34" />
          <stop offset="45%" stop-color="#77756e" />
          <stop offset="100%" stop-color="#232018" />
        </linearGradient>
      </defs>
      <rect width="96" height="96" fill="url(#g)" />
      <rect width="96" height="96" fill="rgba(43,43,43,0.55)" />
      <circle cx="48" cy="48" r="19" fill="none" stroke="#fffffa" stroke-width="2" opacity="0.88" />
      <path d="M45 39.5 58 48 45 56.5Z" fill="#fffffa" />
      <text x="48" y="82" fill="#fffffa" font-family="Arial, sans-serif" font-size="9" text-anchor="middle">${safeTitle.slice(0, 12)}</text>
    </svg>
  `.trim();

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

async function fetchDirectVideoPreview(url: URL) {
  const response = await fetch(url, {
    method: "HEAD",
    redirect: "follow",
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("Unable to access the video file.");
  }

  const title = fileNameFromUrl(url);

  return {
    fileSizeLabel: formatFileSize(response.headers.get("content-length")),
    sourceUrl: url.toString(),
    thumbnailUrl: placeholderThumbnail(title),
    title
  };
}

async function fetchEmbedPreview(url: URL) {
  const noEmbedUrl = `https://noembed.com/embed?url=${encodeURIComponent(url.toString())}`;
  const response = await fetch(noEmbedUrl, {
    next: { revalidate: 3600 }
  });

  if (!response.ok) {
    throw new Error("Unable to fetch video metadata.");
  }

  const data = (await response.json()) as {
    author_name?: string;
    error?: string;
    thumbnail_url?: string;
    title?: string;
  };

  if (data.error) {
    throw new Error(data.error);
  }

  return {
    fileSizeLabel: "Size unavailable",
    sourceUrl: url.toString(),
    thumbnailUrl: data.thumbnail_url || placeholderThumbnail(data.title || data.author_name || fileNameFromUrl(url)),
    title: data.title || data.author_name || fileNameFromUrl(url)
  };
}

export async function GET(request: NextRequest) {
  const rawUrl = request.nextUrl.searchParams.get("url") ?? "";
  const url = validateVideoUrl(rawUrl);

  if (!url) {
    return NextResponse.json({ error: "Invalid video URL." }, { status: 400 });
  }

  try {
    const preview = isDirectVideoAsset(url.pathname) ? await fetchDirectVideoPreview(url) : await fetchEmbedPreview(url);
    return NextResponse.json(preview);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to fetch video metadata." },
      { status: 502 }
    );
  }
}
