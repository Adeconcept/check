const MAX_URL_LENGTH = 2048;

export const VIDEO_HOSTS = new Set([
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

export const DIRECT_VIDEO_EXTENSIONS = [".mp4", ".mov", ".m4v", ".webm", ".avi", ".mkv"];

export function sanitizeVideoUrlCandidate(value: string) {
  return value.replace(/[\u0000-\u001f\u007f]+/g, "").trim().slice(0, MAX_URL_LENGTH);
}

export function isDirectVideoAsset(pathname: string) {
  const lowerPath = pathname.toLowerCase();

  return DIRECT_VIDEO_EXTENSIONS.some((extension) => lowerPath.endsWith(extension));
}

export function validateVideoUrl(value: string) {
  const sanitized = sanitizeVideoUrlCandidate(value);

  if (!sanitized) {
    return { isValid: false, sanitized, reason: "" };
  }

  if (sanitized.length >= MAX_URL_LENGTH) {
    return { isValid: false, sanitized, reason: "Link is too long." };
  }

  let parsed: URL;

  try {
    parsed = new URL(sanitized);
  } catch {
    return { isValid: false, sanitized, reason: "Paste a complete video URL." };
  }

  if (!["https:", "http:"].includes(parsed.protocol)) {
    return { isValid: false, sanitized, reason: "Only http and https links are allowed." };
  }

  if (parsed.username || parsed.password) {
    return { isValid: false, sanitized, reason: "Links with embedded credentials are not allowed." };
  }

  if (!parsed.hostname || parsed.hostname.length > 253) {
    return { isValid: false, sanitized, reason: "Hostname is invalid." };
  }

  if (!VIDEO_HOSTS.has(parsed.hostname.toLowerCase()) && !isDirectVideoAsset(parsed.pathname)) {
    return {
      isValid: false,
      sanitized,
      reason: "Use a supported video platform link or a direct video file URL."
    };
  }

  return { isValid: true, sanitized: parsed.toString(), reason: "", parsed };
}

export function requireValidVideoUrl(value: string) {
  const validation = validateVideoUrl(value);
  return validation.isValid ? validation.parsed : null;
}

