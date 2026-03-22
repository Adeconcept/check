"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import type { EvidenceItemData, VideoAnalysisReport } from "@/lib/video-analysis";
import { getPlaybackConfig, parseTimeRange } from "@/lib/video-playback";

type ReportVideoPanelProps = {
  report: VideoAnalysisReport | null;
  shareHref: string;
};

type SelectedMarker = {
  date: string;
  endSeconds: number;
  label: string;
  original?: boolean;
  startSeconds: number;
  title: string;
};

export function ReportVideoPanel({ report, shareHref }: ReportVideoPanelProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<SelectedMarker | null>(null);

  const playback = useMemo(() => (report ? getPlaybackConfig(report.preview.sourceUrl) : null), [report]);
  const evidenceMarkers = useMemo(() => (report ? report.evidence.map(toMarker) : []), [report]);
  const comparisonMarkers = useMemo(() => (report ? report.comparisonEvidence.map(toMarker) : []), [report]);
  const discrepancyMarkers = useMemo(() => [...evidenceMarkers, ...comparisonMarkers], [comparisonMarkers, evidenceMarkers]);
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
    return (
      <div className="report-section">
        <div className="video-card-empty">Unable to load report details for this video.</div>
      </div>
    );
  }

  return (
    <>
      <div className="report-section">
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

        <div className="section-rule" />

        <div className="section-copy">
          <p className="eyebrow">Verification Details</p>
          <h2 className="section-title">{report.detectionHeadline}</h2>
          <p className="section-text">{report.detectionSummary}</p>
        </div>

        <div className="section-rule" />

        <div className="section-copy">
          <p className="eyebrow">Visual Evidence</p>
          <h2 className="section-title">{report.detectionHeadline}</h2>
          <div className="evidence-list">
            {evidenceMarkers.map((marker) => (
              <EvidenceItemButton
                key={`${marker.title}-${marker.label}`}
                marker={marker}
                onSelect={openPlayer}
                thumbnailUrl={report.preview.thumbnailUrl}
              />
            ))}
          </div>

          <div className="section-copy">
            <h3 className="section-title">Comparison</h3>
            <p className="section-text">{report.visualSummary}</p>
          </div>

          <div className="evidence-list">
            {comparisonMarkers.map((marker) => (
              <EvidenceItemButton
                key={`${marker.title}-${marker.label}`}
                marker={marker}
                onSelect={openPlayer}
                thumbnailUrl={report.preview.thumbnailUrl}
              />
            ))}
          </div>
        </div>

        <div className="section-rule" />

        <div className="section-copy">
          <p className="eyebrow">What to do next</p>
          <h2 className="section-title">User Guidance</h2>
          <p className="section-text">{report.guidance}</p>
          <div className="cta-row">
            <button className="report-action-button report-action-button-inverse" type="button">
              Report video
            </button>
            <Link className="report-action-button" href={shareHref}>
              Share report
            </Link>
          </div>
        </div>
      </div>

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
                    {selectedMarker
                      ? `Showing ${selectedMarker.title.toLowerCase()} at ${selectedMarker.label}.`
                      : "Review the flagged moments below and jump directly to the sections Checky marked as suspicious."}
                  </p>
                </div>

                <div className="report-ai-proof">
                  <p className="report-ai-proof-label">What Checky used</p>
                  <p className="report-ai-proof-value">
                    {report.technicalRows.find(([key]) => key === "Detection record:")?.[1] ?? report.detectionSummary}
                  </p>
                </div>

                <div className="report-discrepancy-list">
                  {discrepancyMarkers.map((marker) => {
                    const isActive = selectedMarker?.label === marker.label && selectedMarker?.title === marker.title;

                    return (
                      <button
                        key={`${marker.title}-${marker.label}`}
                        className={`report-discrepancy-item${isActive ? " is-active" : ""}`}
                        onClick={() => handleMarkerSelect(marker)}
                        type="button"
                      >
                        <span className="report-discrepancy-time">{marker.label}</span>
                        <span className="report-discrepancy-title">{marker.title}</span>
                        <span className="report-discrepancy-date">{marker.date}</span>
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

function EvidenceItemButton({
  marker,
  onSelect,
  thumbnailUrl
}: {
  marker: SelectedMarker;
  onSelect: (marker: SelectedMarker) => void;
  thumbnailUrl: string;
}) {
  return (
    <button className="evidence-item evidence-item-button" onClick={() => onSelect(marker)} type="button">
      <div className={`thumb-small${marker.original ? " original" : ""}`}>
        <Image
          alt=""
          className="thumb-small-image"
          fill
          sizes="48px"
          src={thumbnailUrl}
          style={{ objectPosition: objectPositionFromMarker(marker) }}
          unoptimized
        />
      </div>
      <div className="evidence-copy">
        <p className="evidence-title">{marker.title}</p>
        <div className="evidence-meta">
          <span>{marker.label}</span>
          <span className="meta-dot" aria-hidden="true" />
          <span>{marker.date}</span>
        </div>
      </div>
    </button>
  );
}

function toMarker(item: EvidenceItemData): SelectedMarker {
  const { endSeconds, startSeconds } = parseTimeRange(item.range);

  return {
    date: item.date,
    endSeconds,
    label: item.range,
    original: item.original,
    startSeconds,
    title: item.title
  };
}

function objectPositionFromMarker(marker: SelectedMarker) {
  const horizontal = 30 + (marker.startSeconds % 40);
  const vertical = 35 + (marker.endSeconds % 25);

  return `${horizontal}% ${vertical}%`;
}
