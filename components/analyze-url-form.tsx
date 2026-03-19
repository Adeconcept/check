"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { VideoPreview } from "@/lib/video-analysis";
import { sanitizeVideoUrlCandidate, validateVideoUrl } from "@/lib/video-url";

function formatPreviewTitle(title: string, sourceUrl: string) {
  const url = new URL(sourceUrl);
  const rawTitle = title.trim();
  const extensionMatch = url.pathname.toLowerCase().match(/\.([a-z0-9]{2,5})$/i);
  const extension = extensionMatch ? `.${extensionMatch[1]}` : "";
  const maxBaseLength = 15;
  const normalizedTitle = rawTitle || url.hostname;

  if (normalizedTitle.length <= maxBaseLength) {
    return `${normalizedTitle}${extension}`;
  }

  return `${normalizedTitle.slice(0, maxBaseLength)}...${extension}`;
}

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
  const router = useRouter();
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

    if (!validation.isValid || !preview) {
      return;
    }

    router.push(`/screens/analyzing?url=${encodeURIComponent(validation.sanitized)}`);
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
          maxLength={2048}
          name="videoUrl"
          onChange={(event) => {
            setInputValue(sanitizeVideoUrlCandidate(event.target.value));
          }}
          placeholder="Paste a video url"
          spellCheck={false}
          type="url"
          value={inputValue}
        />
        <button className="gradient-button" disabled={!validation.isValid || !preview || isLoadingPreview} type="submit">
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
            <p className="upload-name">{formatPreviewTitle(preview.title, preview.sourceUrl)}</p>
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
