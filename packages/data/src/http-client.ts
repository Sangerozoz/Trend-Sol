import type { HttpFetchFn, HttpResponse } from "./types";

/**
 * 检测是否在 Tauri 环境中运行
 */
function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

// ============================================================
// 限流器：每个域名独立的请求间隔控制
// ============================================================

const MIN_INTERVAL_MS = 2000; // 每个域名最少间隔2秒
const domainLastRequest = new Map<string, number>();

/**
 * 等待直到可以向指定域名发起请求
 */
async function waitForRateLimit(url: string): Promise<void> {
  const domain = new URL(url).hostname;
  const lastRequest = domainLastRequest.get(domain) || 0;
  const now = Date.now();
  const elapsed = now - lastRequest;
  
  if (elapsed < MIN_INTERVAL_MS) {
    const waitTime = MIN_INTERVAL_MS - elapsed;
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  domainLastRequest.set(domain, Date.now());
}

// ============================================================
// HTTP 429 风控暂停：自动暂停请求并等待
// ============================================================

const domainPaused = new Map<string, number>(); // 暂停到的时间戳

/**
 * 检查域名是否被暂停（风控）
 */
function isDomainPaused(url: string): boolean {
  const domain = new URL(url).hostname;
  const pausedUntil = domainPaused.get(domain) || 0;
  return Date.now() < pausedUntil;
}

/**
 * 暂停域名请求（风控触发）
 */
function pauseDomain(url: string, durationMs: number = 30000): void {
  const domain = new URL(url).hostname;
  domainPaused.set(domain, Date.now() + durationMs);
  console.warn(`[HTTP] 域名 ${domain} 触发风控，暂停 ${durationMs / 1000}秒`);
}

// ============================================================
// 本地缓存：避免重复请求相同数据
// ============================================================

interface CacheEntry {
  data: string;
  timestamp: number;
  ttl: number;
}

const cache = new Map<string, CacheEntry>();

/**
 * 获取缓存的数据
 */
function getCachedData(url: string): string | null {
  const entry = cache.get(url);
  if (!entry) return null;
  
  if (Date.now() > entry.timestamp + entry.ttl) {
    cache.delete(url);
    return null;
  }
  
  return entry.data;
}

/**
 * 设置缓存数据
 */
function setCachedData(url: string, data: string, ttlMs: number = 10000): void {
  cache.set(url, {
    data,
    timestamp: Date.now(),
    ttl: ttlMs,
  });
}

/**
 * 清除所有缓存
 */
export function clearCache(): void {
  cache.clear();
}

// ============================================================
// 重试机制：指数退避策略
// ============================================================

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

/**
 * 计算重试延迟（指数退避）
 */
function getRetryDelay(attempt: number): number {
  return BASE_DELAY_MS * Math.pow(2, attempt) + Math.random() * 1000;
}

// ============================================================
// 核心 HTTP 函数
// ============================================================

/**
 * 浏览器开发环境下，将部分 API URL 重写为 Vite 代理路径
 * - Tauri 环境：直接使用原始 URL（通过 HTTP 插件绕过 CORS）
 * - 浏览器环境：所有接口直接 fetch（实测东财/腾讯均无 CORS 问题，且 Vite 代理可能因网络限制返回 500）
 */
function rewriteUrl(url: string): string {
  // Tauri 和浏览器环境都直接使用原 URL（东财/腾讯接口无 CORS 问题）
  return url;
}

/**
 * 默认 HTTP fetch 实现（浏览器环境）
 */
const defaultFetch: HttpFetchFn = async (url, init) => {
  const rewrittenUrl = rewriteUrl(url);
  const response = await fetch(rewrittenUrl, init);
  const data = await response.text();
  return {
    ok: response.ok,
    status: response.status,
    data,
  };
};

/**
 * 当前使用的 HTTP fetch 函数
 * 默认使用浏览器 fetch，桌面端启动时会被替换为 Tauri HTTP 插件
 */
let currentFetch: HttpFetchFn = defaultFetch;

/**
 * 设置 HTTP fetch 实现（供桌面端注入 Tauri HTTP 插件）
 */
export function setHttpFetch(fn: HttpFetchFn): void {
  currentFetch = fn;
}

/**
 * 发起 GET 请求（带限流、重试、缓存、风控处理）
 * @param url 请求URL
 * @param options 配置选项
 * @param options.cacheTtl 缓存过期时间（毫秒），默认10秒
 * @param options.skipCache 是否跳过缓存
 * @param options.skipRateLimit 是否跳过限流（用于非关键请求）
 */
export async function httpGet(
  url: string,
  options: {
    cacheTtl?: number;
    skipCache?: boolean;
    skipRateLimit?: boolean;
  } = {}
): Promise<string> {
  const { cacheTtl = 10000, skipCache = false, skipRateLimit = false } = options;
  
  // 1. 检查缓存
  if (!skipCache) {
    const cached = getCachedData(url);
    if (cached) {
      return cached;
    }
  }
  
  // 2. 检查域名是否被暂停（风控）
  if (isDomainPaused(url)) {
    throw new Error(`域名暂停中（风控）: ${url}`);
  }
  
  // 3. 等待限流
  if (!skipRateLimit) {
    await waitForRateLimit(url);
  }
  
  // 4. 发起请求（带重试）
  const isBrowser = !isTauri();
  const isEastmoney = /eastmoney\.com/.test(url);
  const headers: Record<string, string> = {};

  if (!isBrowser) {
    // Tauri 环境：完整 headers
    headers["User-Agent"] = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36";
    headers["Referer"] = "https://quote.eastmoney.com/";
  } else if (isEastmoney) {
    // 浏览器环境 + 东财接口：设置 Referer（浏览器会自动忽略 User-Agent，但 Referer 可能有效）
    // 东财接口需要 Referer 才返回数据，否则返回空响应
    headers["Referer"] = "https://quote.eastmoney.com/";
  }

  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await currentFetch(url, {
        method: "GET",
        headers,
      });

      // 检查 HTTP 429（风控警告）
      if (response.status === 429) {
        const retryAfter = parseInt(response.data || '30', 10) || 30;
        pauseDomain(url, retryAfter * 1000);
        throw new Error(`HTTP 429: 触发风控，暂停 ${retryAfter}秒`);
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${url}`);
      }

      // 5. 设置缓存
      if (!skipCache) {
        setCachedData(url, response.data, cacheTtl);
      }

      return response.data;
    } catch (error) {
      lastError = error as Error;
      
      // 如果是风控错误，不重试
      if (lastError.message.includes('429') || lastError.message.includes('风控')) {
        throw lastError;
      }
      
      // 如果是网络错误，重试（指数退避）
      if (attempt < MAX_RETRIES) {
        const delay = getRetryDelay(attempt);
        console.warn(`[HTTP] 请求失败，${delay}ms后重试 (${attempt + 1}/${MAX_RETRIES}): ${url}`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error(`请求失败: ${url}`);
}

/**
 * 发起 JSON GET 请求并解析（带限流、重试、缓存、风控处理）
 */
export async function httpGetJson<T>(
  url: string,
  options?: {
    cacheTtl?: number;
    skipCache?: boolean;
    skipRateLimit?: boolean;
  }
): Promise<T> {
  const text = await httpGet(url, options);
  return JSON.parse(text) as T;
}

// ============================================================
// 工具函数
// ============================================================

/**
 * 清除指定域名的风控暂停
 */
export function clearDomainPause(url: string): void {
  const domain = new URL(url).hostname;
  domainPaused.delete(domain);
}

/**
 * 清除所有域名的风控暂停
 */
export function clearAllDomainPauses(): void {
  domainPaused.clear();
}

/**
 * 获取当前缓存大小
 */
export function getCacheSize(): number {
  return cache.size;
}

/**
 * 清除过期的缓存条目
 */
export function cleanupCache(): void {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (now > entry.timestamp + entry.ttl) {
      cache.delete(key);
    }
  }
}
