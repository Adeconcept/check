"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { EvidenceItemData, VideoAnalysisReport } from "@/lib/video-analysis";
import { VideoThumbnail } from "@/components/video-thumbnail";
import { getPlaybackConfig, parseTimeRange } from "@/lib/video-playback";

type ReportVideoPanelProps = {
  report: VideoAnalysisReport | null;
  shareHref: string;
};

type SelectedMarker = {
  date: string;
  detail: string;
  endSeconds: number;
  label: string;
  original?: boolean;
  startSeconds: number;
  title: string;
};

type ModalMode = "review" | "comparison" | null;

export function ReportVideoPanel({ report, shareHref }: ReportVideoPanelProps) {
  const reviewVideoRef = useRef<HTMLVideoElement | null>(null);
  const compareLeftRef = useRef<HTMLVideoElement | null>(null);
  const compareRightRef = useRef<HTMLVideoElement | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedMarker, setSelectedMarker] = useState<SelectedMarker | null>(null);

  const playback = useMemo(() => (report ? getPlaybackConfig(report.preview.sourceUrl) : null), [report]);
  const evidenceMarkers = useMemo(() => (report ? report.evidence.map(toMarker) : []), [report]);
  const comparisonMarkers = useMemo(() => (report ? report.comparisonEvidence.map(toMarker) : []), [report]);
  const discrepancyMarkers = useMemo(() => evidenceMarkers, [evidenceMarkers]);
  const iframeSrc =
    playback?.kind === "iframe"
      ? playback.toSeekSrc(selectedMarker?.startSeconds ?? 0)
      : playback?.autoplaySrc ?? "";
  const comparisonLeft = comparisonMarkers[0] ?? null;
  const comparisonRight = comparisonMarkers[1] ?? null;
  const comparisonLeftIframeSrc =
    playback?.kind === "iframe" && comparisonLeft ? playback.toSeekSrc(comparisonLeft.startSeconds) : playback?.autoplaySrc ?? "";
  const comparisonRightIframeSrc =
    playback?.kind === "iframe" && comparisonRight ? playback.toSeekSrc(comparisonRight.startSeconds) : playback?.autoplaySrc ?? "";

  function openPlayer(marker?: SelectedMarker) {
    setSelectedMarker(marker ?? evidenceMarkers[0] ?? null);
    setModalMode("review");
  }

  function openComparison() {
    if (!comparisonLeft || !comparisonRight) {
      return;
    }

    setSelectedMarker(comparisonRight);
    setModalMode("comparison");
  }

  function closePlayer() {
    setModalMode(null);
    setSelectedMarker(null);
  }

  function handleMarkerSelect(marker: SelectedMarker) {
    setSelectedMarker(marker);

    if (playback?.kind === "video" && reviewVideoRef.current) {
      reviewVideoRef.current.currentTime = marker.startSeconds;
      void reviewVideoRef.current.play().catch(() => undefined);
    }
  }

  useEffect(() => {
    if (modalMode !== "comparison" || playback?.kind !== "video" || !comparisonLeft || !comparisonRight) {
      return;
    }

    const leftVideo = compareLeftRef.current;
    const rightVideo = compareRightRef.current;

    if (!leftVideo || !rightVideo) {
      return;
    }

    const sync = (video: HTMLVideoElement, startSeconds: number) => {
      const assignTime = () => {
        video.currentTime = startSeconds;
      };

      if (video.readyState >= 1) {
        assignTime();
      } else {
        video.addEventListener("loadedmetadata", assignTime, { once: true });
      }
    };

    sync(leftVideo, comparisonLeft.startSeconds);
    sync(rightVideo, comparisonRight.startSeconds);
  }, [comparisonLeft, comparisonRight, modalMode, playback]);

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
        <button aria-label={`Play ${report.fileName}`} className="video-card video-card-button" onClick={() => openPlayer()} type="button">
          <VideoThumbnail
            alt={`${report.fileName} preview`}
            className="video-card-image"
            fallbackSrc={report.preview.thumbnailUrl}
            priority
            seekSeconds={2}
            sizes="(max-width: 1080px) 100vw, 929px"
            sourceUrl={report.preview.sourceUrl}
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
          {evidenceMarkers.length ? (
            <>
              <h2 className="section-title">Detected manipulation</h2>
              <p className="section-text evidence-intro">
                These are the exact moments Checky flagged in the checked video. Open any item to watch the clip from that point.
              </p>
              <div className="evidence-list">
                {evidenceMarkers.map((marker) => (
                  <EvidenceItemButton
                    key={`${marker.title}-${marker.label}`}
                    marker={marker}
                    onSelect={openPlayer}
                    fallbackThumbnailUrl={report.preview.thumbnailUrl}
                    sourceUrl={report.preview.sourceUrl}
                  />
                ))}
              </div>

              {comparisonMarkers.length >= 2 ? (
                <>
                  <div className="section-copy">
                    <h3 className="section-title">Comparison</h3>
                    <p className="section-text evidence-intro">{report.visualSummary}</p>
                  </div>

                  <div className="evidence-list">
                    {comparisonMarkers.map((marker) => (
                      <EvidenceItemButton
                        key={`${marker.title}-${marker.label}`}
                        marker={marker}
                        onSelect={openComparison}
                        fallbackThumbnailUrl={report.preview.thumbnailUrl}
                        sourceUrl={report.preview.sourceUrl}
                      />
                    ))}
                  </div>
                </>
              ) : null}
            </>
          ) : (
            <>
              <h2 className="section-title">No manipulation found</h2>
              <p className="section-text evidence-intro">
                Checky did not find a clear AI-editing pattern in the parts of this video it could verify.
              </p>
            </>
          )}
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

      {modalMode === "review" ? (
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
                    ref={reviewVideoRef}
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
                      ? `${selectedMarker.detail} Check this at ${selectedMarker.label}.`
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
                        <span className="report-discrepancy-detail">{marker.detail}</span>
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

      {modalMode === "comparison" && comparisonLeft && comparisonRight ? (
        <div className="report-video-modal" role="dialog" aria-modal="true" aria-label={`Compare ${report.fileName}`}>
          <div className="report-video-backdrop" onClick={closePlayer} />
          <div className="report-video-surface report-video-surface-wide">
            <div className="report-video-header">
              <div>
                <p className="report-video-eyebrow">Side-by-side comparison</p>
                <h2 className="report-video-title">Compare the reference clip with the flagged clip</h2>
              </div>
              <button aria-label="Close comparison view" className="report-video-close" onClick={closePlayer} type="button">
                <span />
                <span />
              </button>
            </div>

            <div className="comparison-summary">{report.visualSummary}</div>

            <div className="comparison-grid">
              <ComparisonPanel
                iframeSrc={comparisonLeftIframeSrc}
                marker={comparisonLeft}
                playback={playback}
                poster={report.preview.thumbnailUrl}
                sourceUrl={report.preview.sourceUrl}
                videoRef={compareLeftRef}
              />
              <ComparisonPanel
                iframeSrc={comparisonRightIframeSrc}
                marker={comparisonRight}
                playback={playback}
                poster={report.preview.thumbnailUrl}
                sourceUrl={report.preview.sourceUrl}
                videoRef={compareRightRef}
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function EvidenceItemButton({
  fallbackThumbnailUrl,
  marker,
  onSelect,
  sourceUrl
}: {
  fallbackThumbnailUrl: string;
  marker: SelectedMarker;
  onSelect: (marker: SelectedMarker) => void;
  sourceUrl: string;
}) {
  return (
    <button aria-label={`Preview ${marker.title} at ${marker.label}`} className="evidence-item evidence-item-button" onClick={() => onSelect(marker)} type="button">
      <div className={`thumb-small${marker.original ? " original" : ""}`}>
        <VideoThumbnail
          alt=""
          className="thumb-small-image"
          fallbackSrc={fallbackThumbnailUrl}
          objectPosition={objectPositionFromMarker(marker)}
          seekSeconds={Math.max(0.1, marker.startSeconds || 2)}
          sizes="48px"
          sourceUrl={sourceUrl}
        />
      </div>
      <div className="evidence-copy">
        <p className="evidence-title">{marker.title}</p>
        <p className="evidence-detail">{marker.detail}</p>
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
    detail: item.detail,
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

function ComparisonPanel({
  iframeSrc,
  marker,
  playback,
  poster,
  sourceUrl,
  videoRef
}: {
  iframeSrc: string;
  marker: SelectedMarker;
  playback: ReturnType<typeof getPlaybackConfig> | null;
  poster: string;
  sourceUrl: string;
  videoRef: React.RefObject<HTMLVideoElement | null>;
}) {
  return (
    <section className="comparison-panel">
      <div className="comparison-header">
        <p className="comparison-title">{marker.title}</p>
        <p className="comparison-time">{marker.label}</p>
      </div>
      <p className="comparison-detail">{marker.detail}</p>
      <div className="comparison-player-frame">
        {playback?.kind === "video" ? (
          <video
            ref={videoRef}
            autoPlay
            className="report-video-player comparison-player"
            controls
            muted
            playsInline
            poster={poster}
            src={playback.sourceUrl}
          />
        ) : playback?.kind === "iframe" ? (
          <iframe
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            className="report-video-player comparison-player"
            referrerPolicy="strict-origin-when-cross-origin"
            src={iframeSrc}
            title={`${marker.title} player`}
          />
        ) : (
          <div className="report-video-fallback comparison-fallback">
            <p>Playback for this source is not available inside Checky yet.</p>
            <a href={playback?.sourceUrl ?? sourceUrl} rel="noreferrer" target="_blank">
              Open original video
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
