"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

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

export function AnalyzeUrlForm() {
  const router = useRouter();
  const [inputValue, setInputValue] = useState("");
  const [submittedValue, setSubmittedValue] = useState("");

  const validation = validateVideoUrl(inputValue);
  const isSubmitted = submittedValue.length > 0;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validation.isValid) {
      return;
    }

    setInputValue(validation.sanitized);
    setSubmittedValue(validation.sanitized);
    router.push(`/screens/home-link-upload?url=${encodeURIComponent(validation.sanitized)}`);
  }

  return (
    <form className="analyze-form" noValidate onSubmit={handleSubmit}>
      <div className="analyze-bar" style={isSubmitted ? { borderColor: "#da5678" } : undefined}>
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
            setSubmittedValue("");
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
        {!inputValue
          ? "Only supported video links are allowed."
          : validation.isValid
            ? "Valid video link."
            : validation.reason}
      </div>
    </form>
  );
}
