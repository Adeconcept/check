"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { sanitizeVideoUrlCandidate } from "@/lib/video-url";

const PROGRESS_MESSAGES = [
  { threshold: 12, label: "Checking the source link" },
  { threshold: 28, label: "Fetching video metadata" },
  { threshold: 46, label: "Resolving playback access" },
  { threshold: 63, label: "Checking whether media bytes are reachable" },
  { threshold: 79, label: "Reviewing provenance details" },
  { threshold: 92, label: "Preparing a truthful report" },
  { threshold: 100, label: "Preparing your report" }
];

function readErrorMessage(value: unknown) {
  if (!value || typeof value !== "object") {
    return "Unable to analyze this video right now.";
  }

  const candidate = value as { error?: unknown };

  return typeof candidate.error === "string" ? candidate.error : "Unable to analyze this video right now.";
}

export function AnalyzeProgressScreen({ sourceUrl }: { sourceUrl: string | null }) {
  const router = useRouter();
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");

  const sanitizedUrl = useMemo(() => (sourceUrl ? sanitizeVideoUrlCandidate(sourceUrl) : ""), [sourceUrl]);

  useEffect(() => {
    if (!sanitizedUrl) {
      setErrorMessage("Missing video URL.");
      return;
    }

    let isActive = true;
    let targetProgress = 18;

    const timer = window.setInterval(() => {
      setProgress((current) => {
        if (current >= targetProgress) {
          return current;
        }

        return Math.min(targetProgress, current + 1);
      });
    }, 70);

    async function runAnalysis() {
      try {
        const response = await fetch(`/api/analyze-video?url=${encodeURIComponent(sanitizedUrl)}`, {
          cache: "no-store"
        });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(readErrorMessage(payload));
        }

        if (!isActive) {
          return;
        }

        targetProgress = 100;
        window.setTimeout(() => {
          if (isActive) {
            router.replace(`/screens/report?url=${encodeURIComponent(sanitizedUrl)}`);
          }
        }, 900);
      } catch (error) {
        if (!isActive) {
          return;
        }

        setErrorMessage(error instanceof Error ? error.message : "Unable to analyze this video right now.");
      }
    }

    const progressSteps = [32, 49, 67, 84, 96];
    const progressTimers = progressSteps.map((value, index) =>
      window.setTimeout(() => {
        targetProgress = value;
      }, 500 + index * 550)
    );

    runAnalysis();

    return () => {
      isActive = false;
      window.clearInterval(timer);
      progressTimers.forEach((timeoutId) => window.clearTimeout(timeoutId));
    };
  }, [router, sanitizedUrl]);

  const message =
    PROGRESS_MESSAGES.find((entry) => progress <= entry.threshold)?.label ?? PROGRESS_MESSAGES[PROGRESS_MESSAGES.length - 1].label;

  return (
    <main className="analyzing-shell">
      <div className="loading-cluster">
        <div className="loading-rings" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="loading-copy">
          <span>{errorMessage || "Analyzing content..."}</span>
          <span>{progress}%</span>
        </div>
        <p className="loading-subcopy">{errorMessage || message}</p>
      </div>
    </main>
  );
}
