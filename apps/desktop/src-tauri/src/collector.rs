use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::RwLock;
use chrono::{Datelike, Timelike, Weekday};

// ============================================================
// 数据结构
// ============================================================

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct KLineItem {
    pub time: i64,
    pub open: f64,
    pub close: f64,
    pub high: f64,
    pub low: f64,
    pub volume: f64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub amount: Option<f64>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct QuoteData {
    pub code: String,
    pub name: String,
    pub price: f64,
    pub pre_close: f64,
    pub open: f64,
    pub high: f64,
    pub low: f64,
    pub change_amount: f64,
    pub change_percent: f64,
    pub volume: f64,
    pub amount: f64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub turnover_rate: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub pe_ratio: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub total_market_cap: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub circulating_market_cap: Option<f64>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct CacheMeta {
    pub code: String,
    pub market: String,
    pub period: String,
    pub collected_at: String,
    pub kline_source: String,
    pub quote_source: String,
    pub expired_at: String,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct CacheData {
    pub meta: CacheMeta,
    pub quote: QuoteData,
    pub klines: Vec<KLineItem>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct CachedResult {
    pub data: Option<CacheData>,
    pub expired: bool,
    pub exists: bool,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct WatchlistItem {
    pub code: String,
    pub market: String,
}

// ============================================================
// 缓存管理
// ============================================================

/// 缓存过期时间（秒）
fn cache_ttl(period: &str) -> i64 {
    match period {
        "daily" => 3600,        // 1小时
        "weekly" => 86400,      // 1天
        "monthly" => 604800,    // 1周
        _ => 3600,
    }
}

/// 获取缓存目录
pub fn get_cache_dir(app_data_dir: &PathBuf) -> PathBuf {
    let dir = app_data_dir.join("cache");
    if !dir.exists() {
        let _ = fs::create_dir_all(&dir);
    }
    dir
}

/// 缓存文件路径
fn cache_file_path(app_data_dir: &PathBuf, code: &str, market: &str, period: &str) -> PathBuf {
    get_cache_dir(app_data_dir).join(format!("{}_{}_{}.json", market, code, period))
}

/// 保存缓存
pub fn save_cache(
    app_data_dir: &PathBuf,
    code: &str,
    market: &str,
    period: &str,
    klines: Vec<KLineItem>,
    quote: QuoteData,
    kline_source: &str,
    quote_source: &str,
) {
    let now = chrono::Utc::now();
    let ttl = cache_ttl(period);
    let expired_at = (now + chrono::Duration::seconds(ttl)).to_rfc3339();

    let cache = CacheData {
        meta: CacheMeta {
            code: code.to_string(),
            market: market.to_string(),
            period: period.to_string(),
            collected_at: now.to_rfc3339(),
            kline_source: kline_source.to_string(),
            quote_source: quote_source.to_string(),
            expired_at,
        },
        quote,
        klines,
    };

    let path = cache_file_path(app_data_dir, code, market, period);
    if let Ok(json) = serde_json::to_string_pretty(&cache) {
        let _ = fs::write(&path, json);
    }
}

/// 加载缓存，返回 (数据, 是否过期)
pub fn load_cache(
    app_data_dir: &PathBuf,
    code: &str,
    market: &str,
    period: &str,
) -> CachedResult {
    let path = cache_file_path(app_data_dir, code, market, period);

    if !path.exists() {
        return CachedResult {
            data: None,
            expired: false,
            exists: false,
        };
    }

    match fs::read_to_string(&path) {
        Ok(json) => {
            match serde_json::from_str::<CacheData>(&json) {
                Ok(cache) => {
                    let now = chrono::Utc::now();
                    let expired_at = chrono::DateTime::parse_from_rfc3339(&cache.meta.expired_at)
                        .map(|dt| dt.with_timezone(&chrono::Utc))
                        .unwrap_or(now);
                    let expired = now > expired_at;
                    CachedResult {
                        data: Some(cache),
                        expired,
                        exists: true,
                    }
                }
                Err(_) => CachedResult {
                    data: None,
                    expired: true,
                    exists: false,
                },
            }
        }
        Err(_) => CachedResult {
            data: None,
            expired: true,
            exists: false,
        },
    }
}

// ============================================================
// 交易时段判断
// ============================================================

pub fn is_trading_hours() -> bool {
    let now = chrono::Local::now();
    let weekday = now.weekday();

    // 周末
    if weekday == Weekday::Sat || weekday == Weekday::Sun {
        return false;
    }

    let time = now.hour() * 60 + now.minute();
    // 9:30-11:30 或 13:00-15:00
    (570..=690).contains(&time) || (780..=900).contains(&time)
}

// ============================================================
// 市场编码
// ============================================================

fn to_secid(code: &str, market: &str) -> String {
    match market {
        "A-SH" => format!("1.{}", code),
        "A-SZ" => format!("0.{}", code),
        "HK" => format!("116.{}", code),
        "US-NASDAQ" => format!("105.{}", code),
        "US-NYSE" => format!("106.{}", code),
        _ => format!("1.{}", code),
    }
}

fn to_klt(period: &str) -> &'static str {
    match period {
        "daily" => "101",
        "weekly" => "102",
        "monthly" => "103",
        _ => "101",
    }
}

fn to_tencent_symbol(code: &str, market: &str) -> String {
    match market {
        "A-SH" => format!("sh{}", code),
        "A-SZ" => format!("sz{}", code),
        "HK" => format!("hk{}", code),
        "US-NASDAQ" | "US-NYSE" => format!("us{}", code),
        _ => format!("sh{}", code),
    }
}

fn to_yahoo_symbol(code: &str, market: &str) -> String {
    match market {
        "A-SH" => format!("{}.SS", code),
        "A-SZ" => format!("{}.SZ", code),
        "HK" => format!("{}.HK", code),
        _ => code.to_string(),
    }
}

// ============================================================
// 东方财富
// ============================================================

const UA: &str = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36";
const EM_REFERER: &str = "https://quote.eastmoney.com/";

async fn em_fetch_klines(client: &Client, code: &str, market: &str, period: &str, adjust: &str) -> Result<Vec<KLineItem>, String> {
    let secid = to_secid(code, market);
    let klt = to_klt(period);
    let fqt = match adjust {
        "qfq" => "1",
        "hfq" => "2",
        _ => "0",
    };

    let end_date = chrono::Local::now();
    let range_days = match period {
        "daily" => 730,
        "weekly" => 1825,
        "monthly" => 3650,
        _ => 730,
    };
    let start_date = end_date - chrono::Duration::days(range_days);

    let beg = start_date.format("%Y%m%d").to_string();
    let end = end_date.format("%Y%m%d").to_string();
    let limit = match period {
        "monthly" => 200,
        "weekly" => 600,
        _ => 1000,
    };

    let url = format!(
        "https://push2his.eastmoney.com/api/qt/stock/kline/get?secid={}&klt={}&fqt={}&beg={}&end={}&fields1=f1,f2,f3&fields2=f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61&lmt={}",
        secid, klt, fqt, beg, end, limit
    );

    let resp: serde_json::Value = client
        .get(&url)
        .header("User-Agent", UA)
        .header("Referer", EM_REFERER)
        .send()
        .await
        .map_err(|e| format!("东财K线请求失败: {}", e))?
        .json()
        .await
        .map_err(|e| format!("东财K线解析失败: {}", e))?;

    let klines_arr = resp["data"]["klines"]
        .as_array()
        .ok_or("东财K线为空")?;

    let mut result = Vec::new();
    for line in klines_arr {
        if let Some(s) = line.as_str() {
            let parts: Vec<&str> = s.split(',').collect();
            if parts.len() < 7 {
                continue;
            }
            let date_str = parts[0];
            let time = if date_str.contains(' ') {
                chrono::DateTime::parse_from_str(&format!("{}:00", date_str.replace(" ", "T")), "%Y-%m-%dT%H:%M:%S")
                    .map(|dt| dt.timestamp_millis())
                    .unwrap_or(0)
            } else {
                chrono::DateTime::parse_from_str(&format!("{}T00:00:00", date_str), "%Y-%m-%dT%H:%M:%S")
                    .map(|dt| dt.timestamp_millis())
                    .unwrap_or(0)
            };

            result.push(KLineItem {
                time,
                open: parts[1].parse().unwrap_or(0.0),
                close: parts[2].parse().unwrap_or(0.0),
                high: parts[3].parse().unwrap_or(0.0),
                low: parts[4].parse().unwrap_or(0.0),
                volume: parts[5].parse().unwrap_or(0.0),
                amount: Some(parts[6].parse().unwrap_or(0.0)),
            });
        }
    }

    if result.is_empty() {
        return Err("东财K线为空".to_string());
    }
    Ok(result)
}

async fn em_fetch_quote(client: &Client, code: &str, market: &str) -> Result<QuoteData, String> {
    let secid = to_secid(code, market);
    let fields = "f43,f44,f45,f46,f47,f48,f55,f57,f58,f60,f116,f117,f162,f168,f170";
    let url = format!("https://push2.eastmoney.com/api/qt/stock/get?secid={}&fields={}", secid, fields);

    let resp: serde_json::Value = client
        .get(&url)
        .header("User-Agent", UA)
        .header("Referer", EM_REFERER)
        .send()
        .await
        .map_err(|e| format!("东财行情请求失败: {}", e))?
        .json()
        .await
        .map_err(|e| format!("东财行情解析失败: {}", e))?;

    let d = resp["data"].as_object().ok_or("东财行情为空")?;

    let price = d["f43"].as_f64().unwrap_or(0.0) / 100.0;
    let pre_close = d["f60"].as_f64().unwrap_or(0.0) / 100.0;
    let change_amount = price - pre_close;
    let change_percent = if pre_close > 0.0 {
        change_amount / pre_close * 100.0
    } else {
        0.0
    };

    Ok(QuoteData {
        code: d["f57"].as_str().unwrap_or(code).to_string(),
        name: d["f58"].as_str().unwrap_or("").to_string(),
        price,
        pre_close,
        open: d["f46"].as_f64().unwrap_or(0.0) / 100.0,
        high: d["f44"].as_f64().unwrap_or(0.0) / 100.0,
        low: d["f45"].as_f64().unwrap_or(0.0) / 100.0,
        change_amount,
        change_percent,
        volume: d["f47"].as_f64().unwrap_or(0.0),
        amount: d["f48"].as_f64().unwrap_or(0.0),
        turnover_rate: Some(d["f55"].as_f64().unwrap_or(0.0)),
        pe_ratio: Some(d["f162"].as_f64().unwrap_or(0.0)),
        total_market_cap: Some(d["f116"].as_f64().unwrap_or(0.0)),
        circulating_market_cap: Some(d["f117"].as_f64().unwrap_or(0.0)),
    })
}

// ============================================================
// 腾讯财经
// ============================================================

async fn tx_fetch_klines(client: &Client, code: &str, market: &str, period: &str, adjust: &str) -> Result<Vec<KLineItem>, String> {
    let symbol = to_tencent_symbol(code, market);
    let tx_period = match period {
        "daily" => "day",
        "weekly" => "week",
        "monthly" => "month",
        _ => "day",
    };
    let tx_adjust = match adjust {
        "qfq" => "qfq",
        "hfq" => "hfq",
        _ => "",
    };
    let limit = match period {
        "monthly" => 200,
        "weekly" => 600,
        _ => 1000,
    };

    let param = format!("{},{},{},{},{},{}", symbol, tx_period, "", "", limit, tx_adjust);
    let url = format!("https://web.ifzq.gtimg.cn/appstock/app/fqkline/get?param={}", urlencoding::encode(&param));

    let resp: serde_json::Value = client
        .get(&url)
        .header("User-Agent", UA)
        .send()
        .await
        .map_err(|e| format!("腾讯K线请求失败: {}", e))?
        .json()
        .await
        .map_err(|e| format!("腾讯K线解析失败: {}", e))?;

    if resp["code"].as_i64() != Some(0) {
        return Err("腾讯K线API错误".to_string());
    }

    let symbol_data = &resp["data"][&symbol];

    // 选择复权字段
    let kline_key = if tx_adjust == "qfq" {
        "qfqday"
    } else if tx_adjust == "hfq" {
        "hfqday"
    } else {
        "day"
    };

    let mut klines_arr = symbol_data[kline_key].as_array();
    if klines_arr.is_none() {
        klines_arr = symbol_data["day"].as_array().or_else(|| symbol_data["qfqday"].as_array());
    }

    let klines_arr = klines_arr.ok_or("腾讯K线为空")?;

    let mut result = Vec::new();
    for item in klines_arr {
        if let Some(arr) = item.as_array() {
            if arr.len() < 6 {
                continue;
            }
            let date_str = arr[0].as_str().unwrap_or("");
            let time = if date_str.contains(' ') {
                chrono::DateTime::parse_from_str(&format!("{}:00", date_str.replace(" ", "T")), "%Y-%m-%dT%H:%M:%S")
                    .map(|dt| dt.timestamp_millis())
                    .unwrap_or(0)
            } else {
                chrono::DateTime::parse_from_str(&format!("{}T00:00:00", date_str), "%Y-%m-%dT%H:%M:%S")
                    .map(|dt| dt.timestamp_millis())
                    .unwrap_or(0)
            };

            let open: f64 = arr[1].as_str().and_then(|s| s.parse().ok()).unwrap_or(0.0);
            let close: f64 = arr[2].as_str().and_then(|s| s.parse().ok()).unwrap_or(0.0);
            let high: f64 = arr[3].as_str().and_then(|s| s.parse().ok()).unwrap_or(0.0);
            let low: f64 = arr[4].as_str().and_then(|s| s.parse().ok()).unwrap_or(0.0);
            let volume: f64 = arr[5].as_str().and_then(|s| s.parse().ok()).unwrap_or(0.0) * 100.0;

            result.push(KLineItem {
                time,
                open,
                close,
                high,
                low,
                volume,
                amount: Some(volume * close),
            });
        }
    }

    if result.is_empty() {
        return Err("腾讯K线为空".to_string());
    }
    Ok(result)
}

async fn tx_fetch_quote(client: &Client, code: &str, market: &str) -> Result<QuoteData, String> {
    let symbol = to_tencent_symbol(code, market);
    let url = format!("https://qt.gtimg.cn/q={}", symbol);

    let resp = client
        .get(&url)
        .header("User-Agent", UA)
        .send()
        .await
        .map_err(|e| format!("腾讯行情请求失败: {}", e))?;

    let bytes = resp.bytes().await.map_err(|e| format!("腾讯行情读取失败: {}", e))?;

    // 腾讯返回GBK编码，这里用lossy utf8（中文名可能乱码但数字可用）
    let text = String::from_utf8_lossy(&bytes).to_string();

    // 提取引号内内容
    let start = text.find('"').ok_or("腾讯行情格式错误")?;
    let end = text.rfind('"').ok_or("腾讯行情格式错误")?;
    if end <= start {
        return Err("腾讯行情格式错误".to_string());
    }
    let content = &text[start + 1..end];
    let fields: Vec<&str> = content.split('~').collect();
    if fields.len() < 40 {
        return Err("腾讯行情字段不足".to_string());
    }

    let price: f64 = fields[3].parse().unwrap_or(0.0);
    let pre_close: f64 = fields[4].parse().unwrap_or(0.0);
    let volume_hands: f64 = fields[6].parse().unwrap_or(0.0);
    let change_amount: f64 = fields[31].parse().unwrap_or(0.0);
    let change_percent: f64 = fields[32].parse().unwrap_or(0.0);
    let high: f64 = fields[33].parse().unwrap_or(0.0);
    let low: f64 = fields[34].parse().unwrap_or(0.0);
    let turnover_rate: f64 = fields[38].parse().unwrap_or(0.0);
    let pe_ratio: f64 = fields[39].parse().unwrap_or(0.0);
    let circ_mcap: f64 = fields[44].parse().unwrap_or(0.0);
    let total_mcap: f64 = fields[45].parse().unwrap_or(0.0);

    // 成交额：从 fields[35] 提取（格式 "price/vol/amount"）
    let mut amount = 0.0;
    if let Some(amount_str) = fields.get(35) {
        let parts: Vec<&str> = amount_str.split('/').collect();
        if parts.len() >= 3 {
            amount = parts[2].parse().unwrap_or(0.0);
        }
    }

    Ok(QuoteData {
        code: code.to_string(),
        name: fields[1].to_string(),
        price,
        pre_close,
        open: fields[5].parse().unwrap_or(0.0),
        high,
        low,
        change_amount,
        change_percent,
        volume: volume_hands * 100.0,
        amount,
        turnover_rate: Some(turnover_rate),
        pe_ratio: Some(pe_ratio),
        total_market_cap: Some(total_mcap * 100000000.0),
        circulating_market_cap: Some(circ_mcap * 100000000.0),
    })
}

// ============================================================
// Yahoo Finance
// ============================================================

async fn yh_fetch_klines(client: &Client, code: &str, market: &str, period: &str, adjust: &str) -> Result<Vec<KLineItem>, String> {
    let symbol = to_yahoo_symbol(code, market);
    let interval = match period {
        "daily" => "1d",
        "weekly" => "1wk",
        "monthly" => "1mo",
        _ => "1d",
    };
    let range = match period {
        "daily" => "2y",
        "weekly" => "5y",
        "monthly" => "10y",
        _ => "2y",
    };

    let url = format!(
        "https://query1.finance.yahoo.com/v8/finance/chart/{}?range={}&interval={}&events=div,splits",
        symbol, range, interval
    );

    let resp: serde_json::Value = client
        .get(&url)
        .header("User-Agent", UA)
        .send()
        .await
        .map_err(|e| format!("Yahoo K线请求失败: {}", e))?
        .json()
        .await
        .map_err(|e| format!("Yahoo K线解析失败: {}", e))?;

    let result = &resp["chart"]["result"][0];
    let timestamps = result["timestamp"].as_array().ok_or("Yahoo K线时间戳为空")?;
    let quote = &result["indicators"]["quote"][0];
    let adjclose = &result["indicators"]["adjclose"][0]["adjclose"];

    let mut klines = Vec::new();
    for (i, ts) in timestamps.iter().enumerate() {
        let open = quote["open"].get(i).and_then(|v| v.as_f64());
        let high = quote["high"].get(i).and_then(|v| v.as_f64());
        let low = quote["low"].get(i).and_then(|v| v.as_f64());
        let close = quote["close"].get(i).and_then(|v| v.as_f64());
        let volume = quote["volume"].get(i).and_then(|v| v.as_f64());

        if let (Some(o), Some(h), Some(l), Some(c)) = (open, high, low, close) {
            let final_close = if adjust == "qfq" {
                adjclose.get(i).and_then(|v| v.as_f64()).unwrap_or(c)
            } else {
                c
            };
            klines.push(KLineItem {
                time: ts.as_i64().unwrap_or(0) * 1000,
                open: o,
                close: final_close,
                high: h,
                low: l,
                volume: volume.unwrap_or(0.0),
                amount: Some(0.0),
            });
        }
    }

    if klines.is_empty() {
        return Err("Yahoo K线为空".to_string());
    }
    Ok(klines)
}

async fn yh_fetch_quote(client: &Client, code: &str, market: &str) -> Result<QuoteData, String> {
    let symbol = to_yahoo_symbol(code, market);
    let url = format!("https://query1.finance.yahoo.com/v8/finance/chart/{}?range=1d&interval=1d", symbol);

    let resp: serde_json::Value = client
        .get(&url)
        .header("User-Agent", UA)
        .send()
        .await
        .map_err(|e| format!("Yahoo 行情请求失败: {}", e))?
        .json()
        .await
        .map_err(|e| format!("Yahoo 行情解析失败: {}", e))?;

    let meta = &resp["chart"]["result"][0]["meta"];
    let price = meta["regularMarketPrice"].as_f64().unwrap_or(0.0);
    let pre_close = meta["chartPreviousClose"]
        .as_f64()
        .or_else(|| meta["previousClose"].as_f64())
        .unwrap_or(0.0);

    Ok(QuoteData {
        code: code.to_string(),
        name: meta["symbol"].as_str().unwrap_or(code).to_string(),
        price,
        pre_close,
        open: price,
        high: price,
        low: price,
        change_amount: price - pre_close,
        change_percent: if pre_close > 0.0 {
            (price - pre_close) / pre_close * 100.0
        } else {
            0.0
        },
        volume: meta["regularMarketVolume"].as_f64().unwrap_or(0.0),
        amount: 0.0,
        turnover_rate: None,
        pe_ratio: None,
        total_market_cap: None,
        circulating_market_cap: None,
    })
}

// ============================================================
// 按方法 fallback 采集
// ============================================================

pub async fn fetch_klines_with_fallback(
    client: &Client,
    code: &str,
    market: &str,
    period: &str,
    adjust: &str,
) -> Result<(Vec<KLineItem>, String), String> {
    // 东财 → 腾讯 → Yahoo
    match em_fetch_klines(client, code, market, period, adjust).await {
        Ok(data) => return Ok((data, "东方财富".to_string())),
        Err(e) => eprintln!("[getKLines] 东财失败: {}", e),
    }
    match tx_fetch_klines(client, code, market, period, adjust).await {
        Ok(data) => return Ok((data, "腾讯财经".to_string())),
        Err(e) => eprintln!("[getKLines] 腾讯失败: {}", e),
    }
    match yh_fetch_klines(client, code, market, period, adjust).await {
        Ok(data) => return Ok((data, "Yahoo Finance".to_string())),
        Err(e) => eprintln!("[getKLines] Yahoo失败: {}", e),
    }
    Err("所有数据源K线均不可用".to_string())
}

pub async fn fetch_quote_with_fallback(
    client: &Client,
    code: &str,
    market: &str,
) -> Result<(QuoteData, String), String> {
    match em_fetch_quote(client, code, market).await {
        Ok(data) => return Ok((data, "东方财富".to_string())),
        Err(e) => eprintln!("[getQuote] 东财失败: {}", e),
    }
    match tx_fetch_quote(client, code, market).await {
        Ok(data) => return Ok((data, "腾讯财经".to_string())),
        Err(e) => eprintln!("[getQuote] 腾讯失败: {}", e),
    }
    match yh_fetch_quote(client, code, market).await {
        Ok(data) => return Ok((data, "Yahoo Finance".to_string())),
        Err(e) => eprintln!("[getQuote] Yahoo失败: {}", e),
    }
    Err("所有数据源行情均不可用".to_string())
}

// ============================================================
// 全量采集（保存到缓存）
// ============================================================

pub async fn collect_and_cache(
    client: &Client,
    app_data_dir: &PathBuf,
    code: &str,
    market: &str,
    period: &str,
    adjust: &str,
) -> Result<(), String> {
    let (klines, kline_source) = fetch_klines_with_fallback(client, code, market, period, adjust).await?;
    let (quote, quote_source) = fetch_quote_with_fallback(client, code, market).await?;

    save_cache(
        app_data_dir,
        code,
        market,
        period,
        klines,
        quote,
        &kline_source,
        &quote_source,
    );

    Ok(())
}

// ============================================================
// 后台采集任务
// ============================================================

/// 全局 watchlist 状态（由前端推送）
pub static WATCHLIST: once_cell::sync::Lazy<Arc<RwLock<Vec<WatchlistItem>>>> =
    once_cell::sync::Lazy::new(|| Arc::new(RwLock::new(Vec::new())));

/// 启动后台采集任务
/// 必须在 Tauri 的 async runtime 上下文中调用
pub fn start_background_collector(app_data_dir: PathBuf) {
    tauri::async_runtime::spawn(async move {
        let client = Client::builder()
            .timeout(Duration::from_secs(15))
            .build()
            .unwrap();

        // 1. 启动即采：全量采集 watchlist
        eprintln!("[采集器] 启动，开始全量采集 watchlist...");
        let watchlist = WATCHLIST.read().await.clone();
        for item in &watchlist {
            for period in &["daily", "weekly", "monthly"] {
                if let Err(e) = collect_and_cache(&client, &app_data_dir, &item.code, &item.market, period, "qfq").await {
                    eprintln!("[采集器] {} {} {} 失败: {}", item.code, item.market, period, e);
                }
            }
        }
        eprintln!("[采集器] 全量采集完成");

        // 2. 交易时段定时刷新（4秒）
        let mut interval = tokio::time::interval(Duration::from_secs(4));
        interval.tick().await; // 跳过第一次立即触发

        loop {
            interval.tick().await;

            if !is_trading_hours() {
                continue;
            }

            let watchlist = WATCHLIST.read().await.clone();
            for item in &watchlist {
                // 交易时段只刷新行情和日K
                if let Err(e) = collect_and_cache(&client, &app_data_dir, &item.code, &item.market, "daily", "qfq").await {
                    eprintln!("[采集器] 定时刷新 {} {} 失败: {}", item.code, item.market, e);
                }
            }
        }
    });
}
