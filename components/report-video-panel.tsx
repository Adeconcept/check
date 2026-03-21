"use client";

import Image from "next/image";
import { useMemo, useRef, useState } from "react";
import type { EvidenceItemData, VideoAnalysisReport } from "@/lib/video-analysis";
import { getPlaybackConfig, parseTimeRange } from "@/lib/video-playback";

type ReportVideoPanelProps = {
  report: VideoAnalysisReport | null;
};

type SelectedMarker = {
  endSeconds: number;
  label: string;
  startSeconds: number;
  title: string;
};

export function ReportVideoPanel({ report }: ReportVideoPanelProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<SelectedMarker | null>(null);

  const playback = useMemo(() => (report ? getPlaybackConfig(report.preview.sourceUrl) : null), [report]);
  const discrepancyMarkers = useMemo(
    () => (report ? [...report.evidence, ...report.comparisonEvidence].map(toMarker) : []),
    [report]
  );
  const iframeSrc =
    playback?.kind === "iframe"
      ? playback.toSeekSrc(selectedMarker?.startSeconds ?? 0)
      : playback?.autoplaySrc ?? "";

  function openPlayer(marker?: SelectedMarker) {
    setSelectedMarker(marker ?? discrepancyMarkers[0] ?? null);
    setIsOpen(true);
  }

  function closePlayer() {
    setIsOpen(false);
    setSelectedMarker(null);
  }

  function handleMarkerSelect(marker: SelectedMarker) {
    setSelectedMarker(marker);

    if (playback?.kind === "video" && videoRef.current) {
      videoRef.current.currentTime = marker.startSeconds;
      void videoRef.current.play().catch(() => undefined);
    }
  }

  if (!report) {
    return <div className="video-card-empty">Unable to load report details for this video.</div>;
  }

  return (
    <>
      <button className="video-card video-card-button" onClick={() => openPlayer()} type="button">
        <Image
          alt={`${report.fileName} preview`}
          className="video-card-image"
          fill
          priority
          sizes="(max-width: 1080px) 100vw, 929px"
          src={report.preview.thumbnailUrl}
          unoptimized
        />
        <div className="video-card-overlay" />
        <div className="play-badge" aria-hidden="true" />
      </button>

      {isOpen ? (
        <div className="report-video-modal" role="dialog" aria-modal="true" aria-label={`Play ${report.fileName}`}>
          <div className="report-video-backdrop" onClick={closePlayer} />
          <div className="report-video-surface">
            <div className="report-video-header">
              <div>
                <p className="report-video-eyebrow">Source video</p>
                <h2 className="report-video-title">{report.fileName}</h2>
              </div>
              <button aria-label="Close video player" className="report-video-close" onClick={closePlayer} type="button">
                <span />
                <span />
              </button>
            </div>

            <div className="report-video-layout">
              <div className="report-video-player-frame">
                {playback?.kind === "video" ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    className="report-video-player"
                    controls
                    playsInline
                    poster={report.preview.thumbnailUrl}
                    src={playback.sourceUrl}
                  />
                ) : playback?.kind === "iframe" ? (
                  <iframe
                    allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                    className="report-video-player"
                    referrerPolicy="strict-origin-when-cross-origin"
                    src={iframeSrc}
                    title={`${report.fileName} player`}
                  />
                ) : (
                  <div className="report-video-fallback">
                    <p>Playback for this source is not available inside Checky yet.</p>
                    <a href={playback?.sourceUrl ?? report.preview.sourceUrl} rel="noreferrer" target="_blank">
                      Open original video
                    </a>
                  </div>
                )}
              </div>

              <aside className="report-discrepancy-panel">
                <div className="report-discrepancy-copy">
                  <p className="report-video-eyebrow">Detected discrepancies</p>
                  <p className="report-discrepancy-summary">
                    Review the flagged moments below and jump directly to the sections Checky marked as suspicious.
                  </p>
                </div>
                <div className="report-discrepancy-list">
                  {discrepancyMarkers.map((marker) => {
                    const isActive = selectedMarker?.label === marker.label;

                    return (
                      <button
                        key={marker.label}
                        className={`report-discrepancy-item${isActive ? " is-active" : ""}`}
                        onClick={() => handleMarkerSelect(marker)}
                        type="button"
                      >
                        <span className="report-discrepancy-time">{marker.label}</span>
                        <span className="report-discrepancy-title">{marker.title}</span>
                      </button>
                    );
                  })}
                </div>
              </aside>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function toMarker(item: EvidenceItemData): SelectedMarker {
  const { endSeconds, startSeconds } = parseTimeRange(item.range);

  return {
    endSeconds,
    label: item.range,
    startSeconds,
    title: item.title
  };
}
