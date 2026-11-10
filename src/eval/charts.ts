import type { CurvePoint } from "./coverage.js";

export interface ChartSeries {
  name: string;
  color: string;
  band: string;
  points: CurvePoint[];
  marker: CurvePoint | null;
}

export function headlineChart(series: ChartSeries[], target = 0.05): string {
  const width = 720;
  const height = 480;
  const pad = { left: 72, right: 28, top: 72, bottom: 78 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;
  const minX = 0.5;
  const maxX = 0.99;
  const yValues = series.flatMap((item) => item.points.flatMap((point) => [point.errorRate ?? 0, point.wilsonUpper ?? 0]));
  const maxY = Math.max(target * 1.4, ...yValues, 0.02) * 1.2;
  const xOf = (t: number) => pad.left + ((t - minX) / (maxX - minX)) * plotW;
  const yOf = (y: number) => pad.top + (1 - clamp(y, 0, maxY) / maxY) * plotH;
  const targetY = yOf(target);
  const yTicks = [0, target, maxY].filter((value, index, all) => all.indexOf(value) === index);
  const subtitles = series.map((item) => {
    if (!item.marker || item.marker.wilsonUpper == null) {
      return `${item.name}: no threshold keeps the error bound at or under ${(target * 100).toFixed(0)}%.`;
    }
    return `${item.name}: t = ${item.marker.t.toFixed(2)}, ${(item.marker.coverage * 100).toFixed(1)}% auto-approved, error bound ${(item.marker.wilsonUpper * 100).toFixed(1)}%.`;
  });

  const drawn = series.map((item) => drawSeries(item, xOf, yOf));

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img">`,
    `<title>What share of cases can be safely auto-approved at ${(target * 100).toFixed(0)}% error; the rest go to a nurse.</title>`,
    `<rect width="${width}" height="${height}" fill="#ffffff"/>`,
    `<text x="${pad.left}" y="28" font-family="Georgia, serif" font-size="16" fill="#1c1917">What share of cases can be safely auto-approved</text>`,
    ...subtitles.map(
      (line, index) =>
        `<text x="${pad.left}" y="${46 + index * 16}" font-family="Georgia, serif" font-size="11" fill="#44403c">${escapeXml(line)}</text>`,
    ),
    ...drawn.flatMap((item) => item.band),
    ...drawn.flatMap((item) => item.lines),
    `<line x1="${pad.left}" y1="${targetY.toFixed(1)}" x2="${width - pad.right}" y2="${targetY.toFixed(1)}" stroke="#1d4ed8" stroke-dasharray="4 4"/>`,
    ...yTicks.map((tick) => {
      const y = yOf(tick);
      return `<text x="${pad.left - 8}" y="${(y + 4).toFixed(1)}" text-anchor="end" font-family="ui-sans-serif, sans-serif" font-size="11" fill="#44403c">${(tick * 100).toFixed(0)}%</text>`;
    }),
    `<text x="${pad.left}" y="${height - 42}" font-family="ui-sans-serif, sans-serif" font-size="12" fill="#44403c">Auto-approve threshold</text>`,
    `<text x="18" y="${pad.top + plotH / 2}" transform="rotate(-90 18 ${pad.top + plotH / 2})" font-family="ui-sans-serif, sans-serif" font-size="12" fill="#44403c">Error on auto-approved cases</text>`,
    ...series.map((item, index) => {
      const y = height - 24;
      const x = pad.left + index * 220;
      return `<line x1="${x}" y1="${y}" x2="${x + 22}" y2="${y}" stroke="${item.color}" stroke-width="2"/><text x="${x + 28}" y="${y + 4}" font-family="ui-sans-serif, sans-serif" font-size="11" fill="#44403c">${escapeXml(item.name)}</text>`;
    }),
    `<text x="${width - pad.right}" y="${height - 8}" text-anchor="end" font-family="ui-sans-serif, sans-serif" font-size="11" fill="#78716c">Solid lines: observed error. Bands: 95% Wilson upper bound. Dashed line: ${(target * 100).toFixed(0)}% target.</text>`,
    `</svg>`,
  ].join("");
}

function drawSeries(
  series: ChartSeries,
  xOf: (t: number) => number,
  yOf: (y: number) => number,
): { band: string[]; lines: string[] } {
  const usable = series.points.filter((point) => point.n > 0 && point.errorRate != null && point.wilsonUpper != null);
  if (usable.length === 0) return { band: [], lines: [] };
  const upper = usable.map((point) => `${xOf(point.t).toFixed(1)},${yOf(point.wilsonUpper!).toFixed(1)}`).join(" ");
  const rate = usable.map((point) => `${xOf(point.t).toFixed(1)},${yOf(point.errorRate!).toFixed(1)}`).join(" ");
  const band = `${usable.map((point) => `${xOf(point.t).toFixed(1)},${yOf(point.wilsonUpper!).toFixed(1)}`).join(" ")} ${[...usable].reverse().map((point) => `${xOf(point.t).toFixed(1)},${yOf(0).toFixed(1)}`).join(" ")}`;
  const marker = series.marker
    ? `<circle cx="${xOf(series.marker.t).toFixed(1)}" cy="${yOf(series.marker.wilsonUpper ?? 0).toFixed(1)}" r="4.5" fill="${series.color}"/>`
    : "";
  return {
    band: [`<polygon points="${band}" fill="${series.band}" fill-opacity="0.22"/>`],
    lines: [
      `<polyline points="${upper}" fill="none" stroke="${series.band}" stroke-width="1.5"/>`,
      `<polyline points="${rate}" fill="none" stroke="${series.color}" stroke-width="2"/>`,
      marker,
    ],
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function escapeXml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}
