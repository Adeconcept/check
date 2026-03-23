const MAX_URL_LENGTH = 2048;
const MAX_PATH_LENGTH = 1024;
const MAX_QUERY_LENGTH = 1024;
const MAX_HASH_LENGTH = 512;
const MAX_QUERY_PARAM_COUNT = 40;
const ALLOWED_PORTS = new Set(["", "80", "443"]);

export const DIRECT_VIDEO_EXTENSIONS = [".mp4", ".mov", ".m4v", ".webm", ".avi", ".mkv"];

export function sanitizeVideoUrlCandidate(value: string) {
  return value.replace(/[\u0000-\u001f\u007f]+/g, "").trim().slice(0, MAX_URL_LENGTH);
}

export function isDirectVideoAsset(pathname: string) {
  const lowerPath = pathname.toLowerCase();

  return DIRECT_VIDEO_EXTENSIONS.some((extension) => lowerPath.endsWith(extension));
}

function isPrivateIpv4(hostname: string) {
  const octets = hostname.split(".").map((segment) => Number.parseInt(segment, 10));

  if (octets.length !== 4 || octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) {
    return false;
  }

  return (
    octets[0] === 10 ||
    octets[0] === 127 ||
    (octets[0] === 169 && octets[1] === 254) ||
    (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) ||
    (octets[0] === 192 && octets[1] === 168)
  );
}

function isPrivateIpv6(hostname: string) {
  const normalized = hostname.toLowerCase();

  return (
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe80:") ||
    normalized.startsWith("::ffff:127.") ||
    normalized.startsWith("::ffff:10.") ||
    normalized.startsWith("::ffff:192.168.") ||
    normalized.startsWith("::ffff:172.16.") ||
    normalized.startsWith("::ffff:172.17.") ||
    normalized.startsWith("::ffff:172.18.") ||
    normalized.startsWith("::ffff:172.19.") ||
    normalized.startsWith("::ffff:172.2") ||
    normalized.startsWith("::ffff:172.30.") ||
    normalized.startsWith("::ffff:172.31.")
  );
}

function isIpv4Address(hostname: string) {
  const octets = hostname.split(".");

  return (
    octets.length === 4 &&
    octets.every((segment) => /^\d{1,3}$/.test(segment) && Number.parseInt(segment, 10) >= 0 && Number.parseInt(segment, 10) <= 255)
  );
}

function isIpv6Address(hostname: string) {
  return hostname.includes(":") && /^[0-9a-f:]+$/i.test(hostname);
}

function isPrivateOrLocalHost(hostname: string) {
  const normalized = hostname.toLowerCase();

  if (
    normalized === "localhost" ||
    normalized.endsWith(".localhost") ||
    normalized.endsWith(".local") ||
    normalized.endsWith(".localdomain") ||
    normalized.endsWith(".internal")
  ) {
    return true;
  }

  if (isIpv4Address(normalized)) {
    return isPrivateIpv4(normalized);
  }

  if (isIpv6Address(normalized)) {
    return isPrivateIpv6(normalized);
  }

  return false;
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

  if (!ALLOWED_PORTS.has(parsed.port)) {
    return { isValid: false, sanitized, reason: "Only standard web ports are allowed." };
  }

  if (parsed.username || parsed.password) {
    return { isValid: false, sanitized, reason: "Links with embedded credentials are not allowed." };
  }

  if (!parsed.hostname || parsed.hostname.length > 253) {
    return { isValid: false, sanitized, reason: "Hostname is invalid." };
  }

  if (!/^[a-z0-9.-]+$/i.test(parsed.hostname)) {
    return { isValid: false, sanitized, reason: "Hostname contains invalid characters." };
  }

  if (isPrivateOrLocalHost(parsed.hostname)) {
    return { isValid: false, sanitized, reason: "Private or local network links are not allowed." };
  }

  if (parsed.pathname.length > MAX_PATH_LENGTH || parsed.search.length > MAX_QUERY_LENGTH || parsed.hash.length > MAX_HASH_LENGTH) {
    return { isValid: false, sanitized, reason: "Link is too long." };
  }

  if ([...parsed.searchParams.keys()].length > MAX_QUERY_PARAM_COUNT) {
    return { isValid: false, sanitized, reason: "Link has too many query parameters." };
  }

  return { isValid: true, sanitized: parsed.toString(), reason: "", parsed };
}

export function requireValidVideoUrl(value: string) {
  const validation = validateVideoUrl(value);
  return validation.isValid ? validation.parsed : null;
}
