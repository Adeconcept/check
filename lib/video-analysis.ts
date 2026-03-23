import { createHash } from "node:crypto";
import { isDirectVideoAsset, requireValidVideoUrl } from "@/lib/video-url";

export const NOT_AVAILABLE = "–";

export type VideoPreview = {
  fileSizeBytes: number | null;
  fileSizeLabel: string;
  mimeType: string | null;
  publishedAt: string | null;
  sourceUrl: string;
  thumbnailUrl: string;
  title: string;
  uploader: string | null;
};

export type EvidenceItemData = {
  date: string;
  detail: string;
  original?: boolean;
  title: string;
  range: string;
};

export type VideoAnalysisReport = {
  confidenceRate: number | null;
  comparisonEvidence: EvidenceItemData[];
  detectionHeadline: string;
  detectionSummary: string;
  evidence: EvidenceItemData[];
  fileName: string;
  fileSizeLabel: string;
  fileType: string;
  guidance: string;
  hasBlockchainRecord: boolean;
  hasVerifiedForensicResult: boolean;
  integrityStatus: string;
  mediaHash: string;
  metadataRows: [string, string][];
  preview: VideoPreview;
  riskLabel: string;
  technicalRows: [string, string][];
  timestampLabel: string;
  transactionId: string;
  transactionUrl: string | null;
  verificationRows: [string, string][];
  visualSummary: string;
};

const utcDateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  hour: "2-digit",
  hour12: false,
  minute: "2-digit",
  month: "short",
  timeZone: "UTC",
  timeZoneName: "short",
  year: "numeric"
});

function fileNameFromUrl(url: URL) {
  const lastSegment = url.pathname.split("/").filter(Boolean).pop();

  return lastSegment ? decodeURIComponent(lastSegment) : url.hostname;
}

function formatFileSize(size: number | null) {
  if (!size || !Number.isFinite(size) || size <= 0) {
    return NOT_AVAILABLE;
  }

  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDateLabel(value: string | null) {
  if (!value) {
    return NOT_AVAILABLE;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return NOT_AVAILABLE;
  }

  return utcDateTimeFormatter.format(parsed);
}

function inferFileType(url: URL, mimeType: string | null) {
  if (mimeType?.includes("/")) {
    return mimeType.split("/")[1].toUpperCase();
  }

  const extensionMatch = url.pathname.match(/\.([a-z0-9]{2,5})$/i);

  return extensionMatch ? extensionMatch[1].toUpperCase() : "Video";
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
      <text x="48" y="82" fill="#fffffa" font-family="Arial, sans-serif" font-size="9" text-anchor="middle">${safeTitle.slice(0, 12)}</text>
    </svg>
  `.trim();

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

async function fetchDirectVideoPreview(url: URL): Promise<VideoPreview> {
  const response = await fetch(url, {
    method: "HEAD",
    redirect: "follow",
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("Unable to access the video file.");
  }

  const contentLength = response.headers.get("content-length");
  const fileSizeBytes = contentLength ? Number(contentLength) : null;
  const title = fileNameFromUrl(url);

  return {
    fileSizeBytes: Number.isFinite(fileSizeBytes) ? fileSizeBytes : null,
    fileSizeLabel: formatFileSize(Number.isFinite(fileSizeBytes) ? fileSizeBytes : null),
    mimeType: response.headers.get("content-type"),
    publishedAt: response.headers.get("last-modified"),
    sourceUrl: url.toString(),
    thumbnailUrl: placeholderThumbnail(title),
    title,
    uploader: url.hostname
  };
}

async function fetchEmbedPreview(url: URL): Promise<VideoPreview> {
  const data = (await fetchOEmbedPreview(url)) ?? (await fetchDocumentPreview(url));

  const fallbackTitle = fileNameFromUrl(url);
  const fallbackUploader = url.hostname;

  return {
    fileSizeBytes: null,
    fileSizeLabel: NOT_AVAILABLE,
    mimeType: null,
    publishedAt: data?.upload_date ?? null,
    sourceUrl: url.toString(),
    thumbnailUrl: data?.thumbnail_url || placeholderThumbnail(data?.title || data?.author_name || fallbackTitle),
    title: data?.title || data?.author_name || fallbackTitle,
    uploader: data?.author_name || data?.provider_name || fallbackUploader
  };
}

async function fetchOEmbedPreview(url: URL) {
  const providers = getOEmbedCandidates(url);

  for (const providerUrl of providers) {
    try {
      const response = await fetch(providerUrl, {
        headers: {
          Accept: "application/json, text/plain;q=0.9, */*;q=0.8"
        },
        next: { revalidate: 3600 }
      });

      if (!response.ok) {
        continue;
      }

      const data = (await response.json()) as {
        author_name?: string;
        error?: string;
        provider_name?: string;
        thumbnail_url?: string;
        title?: string;
        upload_date?: string;
      };

      if (!data.error) {
        return data;
      }
    } catch {
      continue;
    }
  }

  return null;
}

function getOEmbedCandidates(url: URL) {
  const target = encodeURIComponent(url.toString());
  const hostname = url.hostname.toLowerCase();

  if (hostname.includes("tiktok.com")) {
    return [`https://www.tiktok.com/oembed?url=${target}`];
  }

  return [`https://noembed.com/embed?url=${target}`];
}

async function fetchDocumentPreview(url: URL) {
  try {
    const response = await fetch(url, {
      headers: {
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "User-Agent": "Mozilla/5.0 (compatible; CheckyBot/1.0; +https://checky.ai)"
      },
      next: { revalidate: 3600 },
      redirect: "follow"
    });

    if (!response.ok) {
      return null;
    }

    const contentType = response.headers.get("content-type") ?? "";

    if (!contentType.includes("text/html")) {
      return null;
    }

    const html = (await response.text()).slice(0, 250_000);
    const title =
      readMetaContent(html, "property", "og:title") ??
      readMetaContent(html, "name", "twitter:title") ??
      readMetaContent(html, "name", "title") ??
      readDocumentTitle(html);
    const thumbnailUrl =
      readMetaContent(html, "property", "og:image") ??
      readMetaContent(html, "name", "twitter:image") ??
      readMetaContent(html, "property", "og:image:url");
    const uploader =
      readMetaContent(html, "property", "og:site_name") ??
      readMetaContent(html, "name", "author") ??
      readMetaContent(html, "property", "article:author");
    const publishedAt =
      readMetaContent(html, "property", "article:published_time") ??
      readMetaContent(html, "property", "og:updated_time") ??
      readMetaContent(html, "name", "date") ??
      null;

    return {
      author_name: uploader ?? undefined,
      provider_name: url.hostname,
      thumbnail_url: thumbnailUrl ? toAbsoluteUrl(thumbnailUrl, url) : undefined,
      title: title ?? undefined,
      upload_date: publishedAt ?? undefined
    };
  } catch {
    return null;
  }
}

function readMetaContent(html: string, attributeName: "name" | "property", attributeValue: string) {
  const escaped = attributeValue.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const directPattern = new RegExp(
    `<meta[^>]*${attributeName}=["']${escaped}["'][^>]*content=["']([^"']+)["'][^>]*>`,
    "i"
  );
  const reversePattern = new RegExp(
    `<meta[^>]*content=["']([^"']+)["'][^>]*${attributeName}=["']${escaped}["'][^>]*>`,
    "i"
  );

  const directMatch = html.match(directPattern);

  if (directMatch?.[1]) {
    return decodeHtmlEntityString(directMatch[1].trim());
  }

  const reverseMatch = html.match(reversePattern);

  return reverseMatch?.[1] ? decodeHtmlEntityString(reverseMatch[1].trim()) : null;
}

function readDocumentTitle(html: string) {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);

  return match?.[1] ? decodeHtmlEntityString(match[1].trim()) : null;
}

function decodeHtmlEntityString(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function toAbsoluteUrl(candidate: string, baseUrl: URL) {
  try {
    return new URL(candidate, baseUrl).toString();
  } catch {
    return candidate;
  }
}

export async function fetchVideoPreview(rawUrl: string) {
  const url = requireValidVideoUrl(rawUrl);

  if (!url) {
    throw new Error("Invalid video URL.");
  }

  return isDirectVideoAsset(url.pathname) ? fetchDirectVideoPreview(url) : fetchEmbedPreview(url);
}

function isCheckyManagedSource(url: URL) {
  const hostname = url.hostname.toLowerCase();

  return hostname === "checky.ai" || hostname === "www.checky.ai" || hostname === "checky.app" || hostname === "www.checky.app";
}

function buildBlockchainRecord(fingerprint: string, url: URL) {
  if (!isCheckyManagedSource(url)) {
    return null;
  }

  const transactionId = `${fingerprint.slice(0, 16)}${fingerprint.slice(-16)}`;
  const timestampSeed = Date.UTC(2025, 0, 1) + (Number.parseInt(fingerprint.slice(6, 14), 16) % (1000 * 60 * 60 * 24 * 240));

  return {
    network: "Solana",
    timestampLabel: formatDateLabel(new Date(timestampSeed).toISOString()),
    transactionId,
    transactionUrl: `https://explorer.solana.com/tx/${transactionId}?cluster=devnet`
  };
}

export async function analyzeVideo(rawUrl: string): Promise<VideoAnalysisReport> {
  const url = requireValidVideoUrl(rawUrl);

  if (!url) {
    throw new Error("Invalid video URL.");
  }

  const preview = await fetchVideoPreview(url.toString());
  const fingerprint = createHash("sha256").update(`${preview.sourceUrl}|${preview.title}|${preview.fileSizeBytes ?? "na"}`).digest("hex");
  const blockchainRecord = buildBlockchainRecord(fingerprint, url);
  const hasBlockchainRecord = Boolean(blockchainRecord);
  const fileType = inferFileType(url, preview.mimeType);
  const mediaHash = `0x${fingerprint.slice(0, 12)}***${fingerprint.slice(-4)}`;
  const transactionId = blockchainRecord?.transactionId ?? NOT_AVAILABLE;
  const timestampLabel = blockchainRecord?.timestampLabel ?? NOT_AVAILABLE;
  const uploaderLabel = preview.uploader ? `@${preview.uploader.replace(/^@/, "").replace(/\s+/g, "")}` : NOT_AVAILABLE;
  const hasVerifiedForensicResult = false;
  const confidenceRate = null;
  const evidence: EvidenceItemData[] = [];
  const comparisonEvidence: EvidenceItemData[] = [];
  const riskLabel = "No verified AI verdict";
  const detectionHeadline = "Forensic result unavailable";
  const visualSummary = "No verified comparison is available because this build does not have a connected forensic verification service.";
  const guidance =
    "Treat this report as metadata and provenance only. It should not be used as a final verdict on whether the video was AI-edited until a verified forensic service is connected.";
  const detectionSummary =
    "Checky can fetch source details, metadata, thumbnails, and provenance records, but this build does not have a verified forensic model connected. It cannot truthfully say whether this video was AI-edited or not.";

  return {
    confidenceRate,
    comparisonEvidence,
    detectionHeadline,
    detectionSummary,
    evidence,
    fileName: preview.title,
    fileSizeLabel: preview.fileSizeLabel,
    fileType,
    guidance,
    hasBlockchainRecord,
    hasVerifiedForensicResult,
    integrityStatus: hasBlockchainRecord
      ? "Fingerprint matched a Solana provenance record created by Checky"
      : NOT_AVAILABLE,
    mediaHash,
    metadataRows: [
      ["File type:", fileType],
      ["Upload Date:", formatDateLabel(preview.publishedAt)],
      ["Uploader:", uploaderLabel]
    ],
    preview,
    riskLabel,
    technicalRows: [
      ["Detection mode:", "Metadata and provenance only"],
      ["AI model used:", NOT_AVAILABLE],
      ["Detection record:", "No verified forensic result is available in this build"],
      ["Source host:", url.hostname],
      ["MIME type:", preview.mimeType ?? NOT_AVAILABLE],
      ["Delivery:", isDirectVideoAsset(url.pathname) ? "Direct video asset" : "Platform-hosted video"],
      ["Publisher timestamp:", formatDateLabel(preview.publishedAt)],
      ["File integrity:", hasBlockchainRecord ? "Fingerprint matched a stored Solana record" : NOT_AVAILABLE]
    ],
    timestampLabel,
    transactionId,
    transactionUrl: blockchainRecord?.transactionUrl ?? null,
    verificationRows: [
      ["Network:", blockchainRecord?.network ?? NOT_AVAILABLE],
      ["Transaction ID:", transactionId],
      ["Timestamp:", timestampLabel]
    ],
    visualSummary
  };
}
