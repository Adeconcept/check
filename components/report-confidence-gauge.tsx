type Segment = {
  path: string;
  stroke: string;
};

const CENTER_X = 117.5;
const CENTER_Y = 116;
const INNER_RADIUS = 78;
const OUTER_RADIUS = 99;
const START_ANGLE = 196;
const END_ANGLE = 344;
const SEGMENT_COUNT = 30;

export function ReportConfidenceGauge({ confidenceRate }: { confidenceRate: number | null }) {
  const hasValue = typeof confidenceRate === "number" && Number.isFinite(confidenceRate);
  const value = hasValue ? Math.min(100, Math.max(0, confidenceRate)) : 50;
  const segments = buildSegments(hasValue);
  const needle = hasValue ? buildNeedle(value) : null;

  return (
    <div className="confidence" aria-label={hasValue ? `Confidence rate ${value}%` : "Confidence rate unavailable"} role="img">
      <svg className="confidence-svg" viewBox="0 0 235 182" aria-hidden="true">
        {segments.map((segment) => (
          <path
            key={segment.path}
            d={segment.path}
            fill="none"
            stroke={segment.stroke}
            strokeLinecap="round"
            strokeWidth="4"
          />
        ))}

        {needle ? <path d={needle.path} fill="#353535" opacity="0.98" /> : null}
        <circle cx={CENTER_X} cy={CENTER_Y} fill="#8D8D8D" r="8.5" />

        <text className="confidence-value-svg" textAnchor="middle" x={CENTER_X} y="154">
          {hasValue ? `${value}%` : "–"}
        </text>

        <text className={hasValue ? "confidence-label-low-svg" : "confidence-label-muted-svg"} x="18" y="130">
          <tspan x="18" dy="0">
            {hasValue ? "Low" : "No verified"}
          </tspan>
          <tspan x="18" dy="13">
            {hasValue ? "confidence" : "result"}
          </tspan>
        </text>

        <text className={hasValue ? "confidence-label-high-svg" : "confidence-label-muted-svg"} textAnchor="end" x="217" y="130">
          <tspan x="217" dy="0">
            {hasValue ? "Extreme" : "Not a"}
          </tspan>
          <tspan x="217" dy="13">
            {hasValue ? "confidence" : "verdict"}
          </tspan>
        </text>
      </svg>
    </div>
  );
}

function buildSegments(hasValue: boolean) {
  return Array.from({ length: SEGMENT_COUNT }, (_, index) => {
    const ratio = index / (SEGMENT_COUNT - 1);
    const angle = START_ANGLE + (END_ANGLE - START_ANGLE) * ratio;
    const radians = (angle * Math.PI) / 180;
    const innerX = CENTER_X + Math.cos(radians) * INNER_RADIUS;
    const innerY = CENTER_Y + Math.sin(radians) * INNER_RADIUS;
    const outerX = CENTER_X + Math.cos(radians) * OUTER_RADIUS;
    const outerY = CENTER_Y + Math.sin(radians) * OUTER_RADIUS;

    return {
      path: `M ${innerX.toFixed(2)} ${innerY.toFixed(2)} L ${outerX.toFixed(2)} ${outerY.toFixed(2)}`,
      stroke: hasValue ? interpolateSegmentColor(ratio) : "rgba(141, 141, 141, 0.45)"
    } satisfies Segment;
  });
}

function interpolateSegmentColor(ratio: number) {
  if (ratio < 0.48) {
    return interpolateHex("#F12D28", "#FF7B57", ratio / 0.48);
  }

  if (ratio < 0.72) {
    return interpolateHex("#FF7B57", "#7D6516", (ratio - 0.48) / 0.24);
  }

  return interpolateHex("#7D6516", "#1DD736", (ratio - 0.72) / 0.28);
}

function interpolateHex(start: string, end: string, ratio: number) {
  const clamped = Math.min(1, Math.max(0, ratio));
  const [sr, sg, sb] = hexToRgb(start);
  const [er, eg, eb] = hexToRgb(end);
  const r = Math.round(sr + (er - sr) * clamped);
  const g = Math.round(sg + (eg - sg) * clamped);
  const b = Math.round(sb + (eb - sb) * clamped);

  return `rgb(${r}, ${g}, ${b})`;
}

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "");

  return [
    Number.parseInt(normalized.slice(0, 2), 16),
    Number.parseInt(normalized.slice(2, 4), 16),
    Number.parseInt(normalized.slice(4, 6), 16)
  ];
}

function buildNeedle(value: number) {
  const angle = START_ANGLE + (END_ANGLE - START_ANGLE) * (value / 100);
  const radians = (angle * Math.PI) / 180;
  const needleLength = 74;
  const tipX = CENTER_X + Math.cos(radians) * needleLength;
  const tipY = CENTER_Y + Math.sin(radians) * needleLength;
  const baseOffset = 5.5;
  const perpendicular = radians + Math.PI / 2;
  const leftBaseX = CENTER_X + Math.cos(perpendicular) * baseOffset;
  const leftBaseY = CENTER_Y + Math.sin(perpendicular) * baseOffset;
  const rightBaseX = CENTER_X - Math.cos(perpendicular) * baseOffset;
  const rightBaseY = CENTER_Y - Math.sin(perpendicular) * baseOffset;

  return {
    path: `M ${leftBaseX.toFixed(2)} ${leftBaseY.toFixed(2)} L ${tipX.toFixed(2)} ${tipY.toFixed(2)} L ${rightBaseX.toFixed(2)} ${rightBaseY.toFixed(2)} Z`
  };
}
