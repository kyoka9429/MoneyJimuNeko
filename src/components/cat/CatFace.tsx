import React from 'react';

// 8bit dot-style cat face SVG component.
// Uses <rect> elements on a 16x16 grid with crispEdges for pixel-art look.
// Expressions differ only in eye and mouth shapes (PROJECTSPEC §9).
// Do NOT overlay this on top of numeric displays (PROJECTSPEC §9).

export type CatVariant = 'smile' | 'neutral' | 'worried';

type Props = {
  variant: CatVariant;
  className?: string;
  // label を渡すとアクセシブルなロゴ画像として扱う（role="img" + aria-label）。
  // 未指定なら装飾として aria-hidden する。
  label?: string;
};

// Pixel coordinate helpers — each cell is 1 unit on the 16x16 grid
type Rect = { x: number; y: number; w?: number; h?: number };

function px(rects: Rect[]) {
  return rects.map(({ x, y, w = 1, h = 1 }, i) => (
    <rect key={i} x={x} y={y} width={w} height={h} />
  ));
}

// --- Shared structure (outline, ears, face, nose) ---
// Outline: 8x8 face centred on 16x16 canvas, starting at (4,4)
const FACE_BODY: Rect[] = [
  // top row
  { x: 5, y: 4, w: 6, h: 1 },
  // sides
  { x: 4, y: 5, w: 1, h: 5 },
  { x: 11, y: 5, w: 1, h: 5 },
  // bottom row
  { x: 5, y: 10, w: 6, h: 1 },
  // ears (triangular, 2px each)
  { x: 4, y: 3, w: 2, h: 1 },
  { x: 10, y: 3, w: 2, h: 1 },
];

// Inner face fill (cream / white)
const FACE_FILL: Rect[] = [{ x: 5, y: 5, w: 6, h: 5 }];

// Nose (paw-pink, centre of face)
const NOSE: Rect[] = [{ x: 7, y: 8, w: 2, h: 1 }];

// --- Eyes per variant ---
const EYES: Record<CatVariant, Rect[]> = {
  // smile: arc-shaped (top pixels only → looks like ^)
  smile: [
    { x: 6, y: 6, w: 1, h: 1 },
    { x: 9, y: 6, w: 1, h: 1 },
    // bottom of arc
    { x: 5, y: 7, w: 1, h: 1 },
    { x: 10, y: 7, w: 1, h: 1 },
  ],
  // neutral: simple dots
  neutral: [
    { x: 6, y: 7, w: 1, h: 1 },
    { x: 9, y: 7, w: 1, h: 1 },
  ],
  // worried: angled inward (\ /)
  worried: [
    { x: 6, y: 6, w: 1, h: 1 },
    { x: 9, y: 6, w: 1, h: 1 },
    { x: 5, y: 7, w: 1, h: 1 },
    { x: 10, y: 7, w: 1, h: 1 },
  ],
};

// --- Mouths per variant ---
const MOUTHS: Record<CatVariant, Rect[]> = {
  // smile: upward curve (w shape)
  smile: [
    { x: 6, y: 9, w: 1, h: 1 },
    { x: 9, y: 9, w: 1, h: 1 },
    { x: 7, y: 10, w: 2, h: 1 },
  ],
  // neutral: flat line
  neutral: [{ x: 6, y: 9, w: 4, h: 1 }],
  // worried: downward curve
  worried: [
    { x: 6, y: 10, w: 1, h: 1 },
    { x: 9, y: 10, w: 1, h: 1 },
    { x: 7, y: 9, w: 2, h: 1 },
  ],
};

export function CatFace({ variant, className, label }: Props): React.JSX.Element {
  const a11yProps = label
    ? { role: 'img' as const, 'aria-label': label }
    : { 'aria-hidden': true as const };

  return (
    <svg
      viewBox="0 0 16 16"
      // crispEdges preserves pixel boundaries for 8bit look
      shapeRendering="crispEdges"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      {...a11yProps}
    >
      {/* Face fill (cream white) */}
      <g fill="#fff8f1">{px(FACE_FILL)}</g>

      {/* Outline + ears (currentColor — caller sets text-brown etc.) */}
      <g fill="currentColor">{px(FACE_BODY)}</g>

      {/* Eyes (currentColor) */}
      <g fill="currentColor">{px(EYES[variant])}</g>

      {/* Nose (paw pink fixed) */}
      <g fill="#f4a6a6">{px(NOSE)}</g>

      {/* Mouth (currentColor) */}
      <g fill="currentColor">{px(MOUTHS[variant])}</g>
    </svg>
  );
}
