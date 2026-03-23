"use client";

import Image from "next/image";
import { CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import { getPlaybackConfig } from "@/lib/video-playback";

type VideoThumbnailProps = {
  alt: string;
  className: string;
  fallbackSrc: string;
  objectPosition?: string;
  priority?: boolean;
  seekSeconds?: number;
  sizes: string;
  sourceUrl: string;
};

export function VideoThumbnail({
  alt,
  className,
  fallbackSrc,
  objectPosition = "center",
  priority = false,
  seekSeconds = 2,
  sizes,
  sourceUrl
}: VideoThumbnailProps) {
  const playback = useMemo(() => getPlaybackConfig(sourceUrl), [sourceUrl]);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [shouldUseFallback, setShouldUseFallback] = useState(playback.kind !== "video");
  const style = useMemo<CSSProperties>(() => ({ objectPosition }), [objectPosition]);

  useEffect(() => {
    setShouldUseFallback(playback.kind !== "video");
  }, [playback.kind, sourceUrl]);

  useEffect(() => {
    if (playback.kind !== "video" || shouldUseFallback) {
      return;
    }

    const video = videoRef.current;

    if (!video) {
      return;
    }

    let disposed = false;

    function seekToFrame() {
      if (disposed) {
        return;
      }

      const currentVideo = videoRef.current;

      if (!currentVideo) {
        setShouldUseFallback(true);
        return;
      }

      const duration = Number.isFinite(currentVideo.duration) && currentVideo.duration > 0 ? currentVideo.duration : null;
      const target = duration ? Math.min(Math.max(0.1, seekSeconds), Math.max(0.1, duration - 0.1)) : seekSeconds;

      try {
        currentVideo.currentTime = target;
      } catch {
        setShouldUseFallback(true);
      }
    }

    function handleSeeked() {
      const currentVideo = videoRef.current;

      if (!currentVideo) {
        return;
      }

      currentVideo.pause();
    }

    function handleError() {
      setShouldUseFallback(true);
    }

    video.addEventListener("loadedmetadata", seekToFrame);
    video.addEventListener("seeked", handleSeeked);
    video.addEventListener("error", handleError);

    if (video.readyState >= 1) {
      seekToFrame();
    } else {
      video.load();
    }

    return () => {
      disposed = true;
      video.removeEventListener("loadedmetadata", seekToFrame);
      video.removeEventListener("seeked", handleSeeked);
      video.removeEventListener("error", handleError);
    };
  }, [playback, seekSeconds, shouldUseFallback]);

  if (playback.kind !== "video" || shouldUseFallback) {
    return <Image alt={alt} className={className} fill priority={priority} sizes={sizes} src={fallbackSrc} style={style} unoptimized />;
  }

  return (
    <video
      aria-label={alt}
      className={className}
      crossOrigin="anonymous"
      muted
      playsInline
      poster={fallbackSrc}
      preload="metadata"
      ref={videoRef}
      src={playback.sourceUrl}
      style={style}
    />
  );
}
