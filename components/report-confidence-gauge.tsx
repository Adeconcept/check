"use client";

import { Gauge, gaugeClasses } from "@mui/x-charts/Gauge";

export function ReportConfidenceGauge({ confidenceRate }: { confidenceRate: number }) {
  const value = Number.isFinite(confidenceRate) ? Math.min(100, Math.max(0, confidenceRate)) : 0;

  return (
    <div className="confidence">
      <Gauge
        id="report-confidence-gauge"
        value={value}
        valueMin={0}
        valueMax={100}
        startAngle={-110}
        endAngle={110}
        innerRadius="72%"
        outerRadius="100%"
        cornerRadius="50%"
        sx={{
          [`& .${gaugeClasses.referenceArc}`]: {
            fill: "rgba(255,255,255,0.08)"
          },
          [`& .${gaugeClasses.valueArc}`]: {
            fill: "url(#confidenceGaugeGradient)"
          },
          [`& .${gaugeClasses.valueText}`]: {
            display: "none"
          }
        }}
        width={235}
        height={182}
        text={() => ""}
      >
        <svg aria-hidden="true" className="confidence-gradient-defs" focusable="false">
          <defs>
            <linearGradient id="confidenceGaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#F12D28" />
              <stop offset="56%" stopColor="#7D6516" />
              <stop offset="100%" stopColor="#1DD736" />
            </linearGradient>
          </defs>
        </svg>
      </Gauge>
      <div className="confidence-center">
        <div className="confidence-value">{value}%</div>
      </div>
      <span className="confidence-axis zero">0</span>
      <span className="confidence-axis fifty">50</span>
      <span className="confidence-axis hundred">100</span>
      <span className="confidence-label low">Low confidence</span>
      <span className="confidence-label high">Extreme confidence</span>
    </div>
  );
}
