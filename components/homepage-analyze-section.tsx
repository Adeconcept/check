"use client";

import { useEffect, useState } from "react";
import { AnalyzeUrlForm } from "@/components/analyze-url-form";

export function HomepageAnalyzeSection() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <AnalyzeUrlFormFallback />;
  }

  return <AnalyzeUrlForm />;
}

function AnalyzeUrlFormFallback() {
  return (
    <form className="analyze-form" noValidate>
      <div className="analyze-bar">
        <input
          aria-label="Video URL"
          autoCapitalize="none"
          autoComplete="off"
          autoCorrect="off"
          className="analyze-input"
          disabled
          name="videoUrl"
          placeholder="Paste a video url"
          readOnly
          spellCheck={false}
          type="url"
          value=""
        />
        <button className="gradient-button" disabled type="submit">
          Analyze
        </button>
      </div>
      <div aria-live="polite" className="analyze-feedback">
        Only supported video links are allowed.
      </div>
    </form>
  );
}
