"use client";

import Image from "next/image";
import { FormEvent, useEffect, useMemo, useState } from "react";

const MAX_URL_LENGTH = 2048;
const VIDEO_HOSTS = [
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
];

const DIRECT_VIDEO_EXTENSIONS = [".mp4", ".mov", ".m4v", ".webm", ".avi", ".mkv"];

function sanitizeVideoUrlCandidate(value: string) {
  return value.replace(/[\u0000-\u001f\u007f]+/g, "").trim().slice(0, MAX_URL_LENGTH);
}

function isDirectVideoAsset(pathname: string) {
  const lowerPath = pathname.toLowerCase();

  return DIRECT_VIDEO_EXTENSIONS.some((extension) => lowerPath.endsWith(extension));
}

function isTrustedVideoHost(hostname: string) {
  return VIDEO_HOSTS.includes(hostname.toLowerCase());
}

function validateVideoUrl(value: string) {
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

  if (!isTrustedVideoHost(parsed.hostname) && !isDirectVideoAsset(parsed.pathname)) {
    return {
      isValid: false,
      sanitized,
      reason: "Use a supported video platform link or a direct video file URL."
    };
  }

  return { isValid: true, sanitized: parsed.toString(), reason: "" };
}

type VideoPreview = {
  fileSizeLabel: string;
  sourceUrl: string;
  thumbnailUrl: string;
  title: string;
};

function isVideoPreview(value: unknown): value is VideoPreview {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.title === "string" &&
    typeof candidate.thumbnailUrl === "string" &&
    typeof candidate.fileSizeLabel === "string" &&
    typeof candidate.sourceUrl === "string"
  );
}

export function AnalyzeUrlForm() {
  const [inputValue, setInputValue] = useState("");
  const [preview, setPreview] = useState<VideoPreview | null>(null);
  const [previewError, setPreviewError] = useState("");
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  const validation = useMemo(() => validateVideoUrl(inputValue), [inputValue]);

  useEffect(() => {
    if (!validation.isValid) {
      setPreview(null);
      setPreviewError(inputValue ? validation.reason : "");
      setIsLoadingPreview(false);
      return;
    }

    const controller = new AbortController();

    async function fetchPreview() {
      setIsLoadingPreview(true);
      setPreviewError("");

      try {
        const response = await fetch(`/api/video-preview?url=${encodeURIComponent(validation.sanitized)}`, {
          signal: controller.signal
        });

        const data = (await response.json()) as { error?: string } | VideoPreview;

        if (!response.ok || !isVideoPreview(data)) {
          setPreview(null);
          setPreviewError("error" in data ? data.error ?? "Unable to fetch video metadata." : "Unable to fetch video metadata.");
          return;
        }

        setPreview(data);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setPreview(null);
        setPreviewError(error instanceof Error ? error.message : "Unable to fetch video metadata.");
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingPreview(false);
        }
      }
    }

    fetchPreview();

    return () => controller.abort();
  }, [inputValue, validation]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validation.isValid) {
      return;
    }
  }

  return (
    <form className="analyze-form" noValidate onSubmit={handleSubmit}>
      <div className="analyze-bar" style={preview ? { borderColor: "#da5678" } : undefined}>
        <input
          aria-label="Video URL"
          autoCapitalize="none"
          autoComplete="off"
          autoCorrect="off"
          className={`analyze-input ${validation.isValid ? "is-valid" : ""}`}
          inputMode="url"
          maxLength={MAX_URL_LENGTH}
          name="videoUrl"
          onChange={(event) => {
            setInputValue(sanitizeVideoUrlCandidate(event.target.value));
          }}
          placeholder="Paste a video url"
          spellCheck={false}
          type="url"
          value={inputValue}
        />
        <button className="gradient-button" disabled={!validation.isValid} type="submit">
          Analyze
        </button>
      </div>
      <div aria-live="polite" className="analyze-feedback">
        {!inputValue ? "Only supported video links are allowed." : isLoadingPreview ? "Fetching video metadata..." : preview ? "Video metadata loaded." : previewError}
      </div>
      {preview ? (
        <div className="upload-card">
          <div className="upload-thumb">
            <Image alt="" className="upload-thumb-image" fill sizes="48px" src={preview.thumbnailUrl} unoptimized />
            <span className="upload-thumb-overlay" />
            <span className="upload-thumb-play" aria-hidden="true" />
          </div>
          <div className="upload-meta">
            <p className="upload-name">{preview.title}</p>
            <p className="upload-size">{preview.fileSizeLabel}</p>
          </div>
          <button
            className="close-icon"
            onClick={() => {
              setInputValue("");
              setPreview(null);
              setPreviewError("");
            }}
            type="button"
            aria-label="Clear video preview"
          />
        </div>
      ) : null}
    </form>
  );
}
