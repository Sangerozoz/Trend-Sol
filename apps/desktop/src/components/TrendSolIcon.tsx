import type { SVGProps } from "react";

/**
 * 桌面 trendsol-icon 官方图标资产（viewBox 0 0 48 48，原 stroke/fill="#333"）。
 * 统一改为 currentColor，1em 跟随父级 font-size（导航 text-lg=18px），颜色跟随 text-white/text-muted。
 * 命名约定：无 _fill 后缀 = 未选中线稿；_fill 后缀 = 选中填充实心。
 */

// ---- AI诊股：六个点_six-points ----
// 中心节点向 6 个点辐射的连线
const SIX_POINTS_LINES =
  "M23.9999 24V12M23.9999 24L13.5 30.0621L23.9999 24ZM23.9999 24L34.4998 30.0621L23.9999 24Z";
// 6 个圆点（path 圆描边）
const SIX_POINTS_DOTS = [
  "M14 16C14 18.2091 12.2091 20 10 20C7.79086 20 6 18.2091 6 16C6 13.7909 7.79086 12 10 12C12.2091 12 14 13.7909 14 16Z",
  "M14 32C14 34.2091 12.2091 36 10 36C7.79086 36 6 34.2091 6 32C6 29.7909 7.79086 28 10 28C12.2091 28 14 29.7909 14 32Z",
  "M28 40C28 42.2091 26.2091 44 24 44C21.7909 44 20 42.2091 20 40C20 37.7909 21.7909 36 24 36C26.2091 36 28 37.7909 28 40Z",
  "M42 32C42 34.2091 40.2091 36 38 36C35.7909 36 34 34.2091 34 32C34 29.7909 35.7909 28 38 28C40.2091 28 42 29.7909 42 32Z",
  "M42 16C42 18.2091 40.2091 20 38 20C35.7909 20 34 18.2091 34 16C34 13.7909 35.7909 12 38 12C40.2091 12 42 13.7909 42 16Z",
  "M28 8C28 10.2091 26.2091 12 24 12C21.7909 12 20 10.2091 20 8C20 5.79086 21.7909 4 24 4C26.2091 4 28 5.79086 28 8Z",
];

/** 六个点_six-points（未选中线稿）：连线 + 圆点均为描边 */
export function SixPointsLine(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      viewBox="0 0 48 48"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="butt"
      strokeLinejoin="miter"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d={SIX_POINTS_LINES} />
      {SIX_POINTS_DOTS.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}

/** 六个点_six-points_fill（选中填充实心）：圆点实心填充，连线描边 */
export function SixPointsFill(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      viewBox="0 0 48 48"
      width="1em"
      height="1em"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="butt"
      strokeLinejoin="miter"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d={SIX_POINTS_LINES} />
      {SIX_POINTS_DOTS.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}

// ---- 订阅：皇冠帽_crown-three ----
const CROWN_PATH = "M13 42H35L41 21L31 26L24 12L17 26L7 21L13 42Z";
const CROWN_DOTS = [
  { cx: 7, cy: 18 },
  { cx: 24, cy: 9 },
  { cx: 41, cy: 18 },
];

/** 皇冠帽_crown-three（未选中线稿）：皇冠轮廓 + 3 圆点均为描边 */
export function CrownLine(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      viewBox="0 0 48 48"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="butt"
      strokeLinejoin="miter"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d={CROWN_PATH} />
      {CROWN_DOTS.map((d, i) => (
        <circle key={i} cx={d.cx} cy={d.cy} r={3} />
      ))}
    </svg>
  );
}

/** 皇冠帽_crown-three_fill（选中填充实心）：皇冠 + 圆点实心填充 */
export function CrownFill(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      viewBox="0 0 48 48"
      width="1em"
      height="1em"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="butt"
      strokeLinejoin="miter"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d={CROWN_PATH} />
      {CROWN_DOTS.map((d, i) => (
        <circle key={i} cx={d.cx} cy={d.cy} r={3} />
      ))}
    </svg>
  );
}

// ---- 置顶 / 移到队首：去顶部_to-top ----
const TO_TOP_PATHS = [
  "M24.0083 14.1006V42.0001", // 竖线
  "M12 26L24 14L36 26", // 向上箭头
  "M12 6H36", // 顶部横线
];

/** 去顶部_to-top（置顶/移到队首图标）：桌面 trendsol-icon 官方线稿资产 */
export function ToTopIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      viewBox="0 0 48 48"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="butt"
      strokeLinejoin="miter"
      xmlns="http://www.w3.org/2000/svg"
    >
      {TO_TOP_PATHS.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}
