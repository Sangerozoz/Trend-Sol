import { useEffect, useRef, type RefObject } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

// 注册 useGSAP 插件（与 React 生命周期/清理集成）
gsap.registerPlugin(useGSAP);

// 尊重系统"减少动态效果"偏好：开启时所有装饰动画跳过，内容直接可见
export const prefersReducedMotion =
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * 数值变化时的轻微脉冲（股票"跳动"感）。
 * 仅使用 transform(scale) + opacity，不影响布局；值首次出现（加载）与值不变时不触发。
 */
export function useValuePulse(ref: RefObject<HTMLElement>, value?: number) {
  const prev = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (prefersReducedMotion) return;
    const el = ref.current;
    if (
      el &&
      prev.current !== undefined &&
      value !== undefined &&
      value !== prev.current
    ) {
      gsap.fromTo(
        el,
        { scale: 1.12 },
        { scale: 1, duration: 0.4, ease: "power2.out", overwrite: "auto" }
      );
    }
    prev.current = value;
  }, [value, ref]);
}

export { gsap, useGSAP };
