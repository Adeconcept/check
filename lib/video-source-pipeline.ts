import { isDirectVideoAsset } from "@/lib/video-url";

export type SourceAccessLevel = "direct_media" | "embedded_media" | "metadata_only";
export type VerificationState = "provenance_verified" | "forensic_ready" | "metadata_only";

export type SourcePipelineResult = {
  accessLevel: SourceAccessLevel;
  canPreviewInApp: boolean;
  canRetrieveMediaBytes: boolean;
  nextStep: string;
  playbackKind: "direct" | "embed" | "external";
  providerLabel: string;
  retrievalSummary: string;
  verificationState: VerificationState;
};

const EMBED_PROVIDERS: Array<{ host: string; label: string }> = [
  { host: "youtube.com", label: "YouTube" },
  { host: "youtu.be", label: "YouTube" },
  { host: "vimeo.com", label: "Vimeo" },
  { host: "loom.com", label: "Loom" },
  { host: "drive.google.com", label: "Google Drive" },
  { host: "tiktok.com", label: "TikTok" }
];

export function describeSourcePipeline(url: URL, hasBlockchainRecord: boolean): SourcePipelineResult {
  if (isDirectVideoAsset(url.pathname)) {
    return {
      accessLevel: "direct_media",
      canPreviewInApp: true,
      canRetrieveMediaBytes: true,
      nextStep: hasBlockchainRecord
        ? "Run byte-level forensic checks and compare the fingerprint against the Checky record."
        : "Run byte-level forensic checks on the retrieved media file.",
      playbackKind: "direct",
      providerLabel: "Direct media file",
      retrievalSummary: "Checky can retrieve the actual video bytes from this link.",
      verificationState: hasBlockchainRecord ? "provenance_verified" : "forensic_ready"
    };
  }

  const provider = EMBED_PROVIDERS.find(({ host }) => {
    const hostname = url.hostname.toLowerCase();
    return hostname === host || hostname.endsWith(`.${host}`);
  });

  if (provider) {
    return {
      accessLevel: "embedded_media",
      canPreviewInApp: true,
      canRetrieveMediaBytes: false,
      nextStep:
        "Resolve the underlying media stream or downloadable source on the backend before making a forensic verdict.",
      playbackKind: "embed",
      providerLabel: provider.label,
      retrievalSummary:
        "Checky can preview this post inside the app, but this link does not expose the raw video bytes directly.",
      verificationState: hasBlockchainRecord ? "provenance_verified" : "metadata_only"
    };
  }

  return {
    accessLevel: "metadata_only",
    canPreviewInApp: false,
    canRetrieveMediaBytes: false,
    nextStep: "Collect a direct media file or a provider-supported stream before making any forensic claim.",
    playbackKind: "external",
    providerLabel: url.hostname,
    retrievalSummary:
      "Checky can read public metadata from this link, but it cannot reliably access an in-app playable stream or raw video bytes from it yet.",
    verificationState: hasBlockchainRecord ? "provenance_verified" : "metadata_only"
  };
}
