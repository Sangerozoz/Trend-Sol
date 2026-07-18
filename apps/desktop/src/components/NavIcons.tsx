import type { SVGProps } from "react";

/**
 * 「我的」填充(实心)图标：复用 Arco IconUser 的原始 path（头部圆 + 肩部），fill=currentColor 实心化。
 * 尺寸 1em 跟随父级 font-size，颜色跟随 currentColor。
 */
export function UserFill(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      viewBox="0 0 48 48"
      fill="currentColor"
      stroke="currentColor"
      width="1em"
      height="1em"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M7 37c0-4.97 4.03-8 9-8h16c4.97 0 9 3.03 9 8v3a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1v-3Z" />
      <circle cx="24" cy="15" r="8" />
    </svg>
  );
}
