import type { SVGProps } from "react";

/**
 * 自定义「行情」图标（用户提供 SVG：股市_stock-market.svg / 股市_stock-market fill.svg）。
 * 已将原硬编码 #333 改为 currentColor，跟随父级文字色（选中 text-white / 未选中 text-text-muted）。
 * - line 版：rect 不填充（fill="none"）
 * - fill 版：rect 实心填充（fill="currentColor"）
 * 尺寸用 1em 跟随字体大小，与 Arco 图标（text-lg）保持一致。
 */
export function StockMarketIcon({ filled = false, className, ...rest }: SVGProps<SVGSVGElement> & { filled?: boolean }) {
  const rectFill = filled ? "currentColor" : "none";
  const stroke = "currentColor";
  return (
    <svg
      viewBox="0 0 48 48"
      width="1em"
      height="1em"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      {...rest}
    >
      <rect x="6" y="20" width="8" height="14" fill={rectFill} stroke={stroke} strokeWidth={3} strokeLinejoin="miter" />
      <rect x="20" y="14" width="8" height="26" fill={rectFill} stroke={stroke} strokeWidth={3} strokeLinejoin="miter" />
      <path d="M24 44V40" stroke={stroke} strokeWidth={3} strokeLinecap="butt" strokeLinejoin="miter" />
      <rect x="34" y="12" width="8" height="9" fill={rectFill} stroke={stroke} strokeWidth={3} strokeLinejoin="miter" />
      <path d="M10 20V10" stroke={stroke} strokeWidth={3} strokeLinecap="butt" strokeLinejoin="miter" />
      <path d="M38 34V21" stroke={stroke} strokeWidth={3} strokeLinecap="butt" strokeLinejoin="miter" />
      <path d="M38 12V4" stroke={stroke} strokeWidth={3} strokeLinecap="butt" strokeLinejoin="miter" />
    </svg>
  );
}

export const StockMarketLine = (props: SVGProps<SVGSVGElement> & { filled?: boolean }) => (
  <StockMarketIcon {...props} filled={false} />
);

export const StockMarketFill = (props: SVGProps<SVGSVGElement> & { filled?: boolean }) => (
  <StockMarketIcon {...props} filled />
);
