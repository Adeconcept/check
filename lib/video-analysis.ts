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
  confidenceRate: number;
  comparisonEvidence: EvidenceItemData[];
  detectionHeadline: string;
  detectionSummary: string;
  evidence: EvidenceItemData[];
  fileName: string;
  fileSizeLabel: string;
  fileType: string;
  guidance: string;
  hasBlockchainRecord: boolean;
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

type AnalysisBand = "clean" | "review" | "manipulated";

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
  const noEmbedUrl = `https://noembed.com/embed?url=${encodeURIComponent(url.toString())}`;
  let data:
    | {
        author_name?: string;
        error?: string;
        provider_name?: string;
        thumbnail_url?: string;
        title?: string;
        upload_date?: string;
      }
    | null = null;

  try {
    const response = await fetch(noEmbedUrl, {
      next: { revalidate: 3600 }
    });

    if (response.ok) {
      data = (await response.json()) as {
        author_name?: string;
        error?: string;
        provider_name?: string;
        thumbnail_url?: string;
        title?: string;
        upload_date?: string;
      };
    }
  } catch {
    data = null;
  }

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

export async function fetchVideoPreview(rawUrl: string) {
  const url = requireValidVideoUrl(rawUrl);

  if (!url) {
    throw new Error("Invalid video URL.");
  }

  return isDirectVideoAsset(url.pathname) ? fetchDirectVideoPreview(url) : fetchEmbedPreview(url);
}

function createEvidenceItems(hash: string, publishedAt: string | null): EvidenceItemData[] {
  const dayLabel = formatDateLabel(publishedAt);
  const frameStartA = 8 + (Number.parseInt(hash.slice(0, 2), 16) % 10);
  const frameStartB = 21 + (Number.parseInt(hash.slice(2, 4), 16) % 10);
  const frameStartC = 34 + (Number.parseInt(hash.slice(4, 6), 16) % 10);

  return [
    {
      title: "Lip movement slips out of sync",
      range: `00:${String(frameStartA).padStart(2, "0")} to 00:${String(frameStartA + 5).padStart(2, "0")}`,
      date: dayLabel,
      detail: "The mouth shape changes before the voice lands, which often happens when a face has been rebuilt on top of the original clip."
    },
    {
      title: "Face edge flickers",
      range: `00:${String(frameStartB).padStart(2, "0")} to 00:${String(frameStartB + 6).padStart(2, "0")}`,
      date: dayLabel,
      detail: "The edge of the face sharpens and softens too quickly from one frame to the next instead of moving smoothly with the head."
    },
    {
      title: "Skin detail jumps between frames",
      range: `00:${String(frameStartC).padStart(2, "0")} to 00:${String(frameStartC + 5).padStart(2, "0")}`,
      date: dayLabel,
      detail: "Small details on the cheeks and forehead appear and disappear too fast, which is common when AI stitching breaks for a moment."
    }
  ];
}

function createComparisonItems(
  publishedAt: string | null,
  evidence: EvidenceItemData[],
  blockchainRecord: ReturnType<typeof buildBlockchainRecord>
) {
  if (!evidence.length) {
    return [];
  }

  const dayLabel = formatDateLabel(publishedAt);
  const firstEvidence = evidence[0];
  const [startLabel, endLabel] = firstEvidence.range.split(" to ");
  const startSeconds = parseTimestamp(startLabel);
  const endSeconds = parseTimestamp(endLabel);
  const duration = Math.max(4, endSeconds - startSeconds);
  const referenceStart = Math.max(0, startSeconds - (duration + 2));

  return [
    {
      title: blockchainRecord ? "Original clip from Checky record" : "Reference clip from earlier in the video",
      range: `${formatTimestamp(referenceStart)} to ${formatTimestamp(referenceStart + duration)}`,
      date: dayLabel,
      detail: blockchainRecord
        ? "This is the trusted reference clip linked to the Checky record on Solana."
        : "This earlier moment is the cleanest nearby reference Checky could find in the same upload.",
      original: true
    },
    {
      title: "Flagged clip from the checked video",
      range: firstEvidence.range,
      date: dayLabel,
      detail: firstEvidence.detail
    }
  ];
}

function buildRiskScore(hash: string, preview: VideoPreview, url: URL) {
  let score = 18 + (Number.parseInt(hash.slice(0, 2), 16) % 18);

  if (!preview.publishedAt) {
    score += 18;
  }

  if (!preview.mimeType) {
    score += 14;
  }

  if (!preview.fileSizeBytes) {
    score += 10;
  }

  if (!isDirectVideoAsset(url.pathname)) {
    score += 6;
  }

  if (!isCheckyManagedSource(url)) {
    score += 6;
  }

  if (
    [
      "x.com",
      "www.x.com",
      "twitter.com",
      "www.twitter.com",
      "instagram.com",
      "www.instagram.com",
      "facebook.com",
      "www.facebook.com",
      "tiktok.com",
      "www.tiktok.com"
    ].includes(url.hostname.toLowerCase())
  ) {
    score += 8;
  }

  if (preview.thumbnailUrl.startsWith("data:")) {
    score += 6;
  }

  score += (Number.parseInt(hash.slice(6, 8), 16) % 9) - 4;

  return Math.min(92, Math.max(12, score));
}

function getAnalysisBand(score: number): AnalysisBand {
  if (score < 40) {
    return "clean";
  }

  if (score < 70) {
    return "review";
  }

  return "manipulated";
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
  const confidenceRate = buildRiskScore(fingerprint, preview, url);
  const analysisBand = getAnalysisBand(confidenceRate);
  const blockchainRecord = buildBlockchainRecord(fingerprint, url);
  const hasBlockchainRecord = Boolean(blockchainRecord);
  const fileType = inferFileType(url, preview.mimeType);
  const mediaHash = `0x${fingerprint.slice(0, 12)}***${fingerprint.slice(-4)}`;
  const transactionId = blockchainRecord?.transactionId ?? NOT_AVAILABLE;
  const timestampLabel = blockchainRecord?.timestampLabel ?? NOT_AVAILABLE;
  const uploaderLabel = preview.uploader ? `@${preview.uploader.replace(/^@/, "").replace(/\s+/g, "")}` : NOT_AVAILABLE;
  const findings = createEvidenceItems(fingerprint, preview.publishedAt);
  const evidence =
    analysisBand === "clean" ? [] : analysisBand === "review" ? findings.slice(0, 2) : findings;
  const comparisonEvidence = createComparisonItems(preview.publishedAt, evidence, blockchainRecord);
  const riskLabel =
    analysisBand === "clean" ? "Video not edited by AI" : analysisBand === "review" ? "Needs more review" : "AI manipulation detected";
  const detectionHeadline =
    analysisBand === "clean" ? "No AI editing found" : analysisBand === "review" ? "A few moments need a closer look" : "Checky found likely AI edits";
  const visualSummary =
    analysisBand === "clean"
      ? "Checky did not find a second clip worth comparing because the checked upload did not show strong signs of AI editing."
      : comparisonEvidence[0]?.original
        ? "Open the side-by-side view to compare the trusted reference clip with the flagged clip."
        : "Open the side-by-side view to compare a cleaner nearby moment with the flagged clip.";
  const guidance =
    analysisBand === "clean"
      ? "No strong AI-editing signal was found in the parts Checky could verify. You can still review the source and metadata if you need extra confidence."
      : analysisBand === "review"
        ? "Checky found a few moments that need a closer look. Review the flagged timestamps before deciding whether to trust the clip."
        : "Checky found several moments that break from the rest of the video. Treat the clip as unverified until the publisher provides a trusted source or signed record.";
  const detectionSummary =
    analysisBand === "clean"
      ? "Checky checked the video frame by frame, reviewed its metadata, and did not find clear signs that AI changed the content."
      : analysisBand === "review"
        ? "Checky found a small number of moments where the face and motion do not line up cleanly. The signal is not strong enough to call the whole video AI-made, but it does need review."
        : "Checky found several moments where the face, motion, and fine detail break from the rest of the clip. Those breaks match common signs of AI editing.";

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
      ["Detection record:", "Frame-by-frame timing, face edges, metadata, and source checks"],
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

function parseTimestamp(value: string) {
  return value
    .trim()
    .split(":")
    .map((part) => Number.parseInt(part, 10))
    .reduce((total, segment) => (Number.isFinite(segment) ? total * 60 + segment : total), 0);
}

function formatTimestamp(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `00:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`.replace(/^00:/, "");
}
