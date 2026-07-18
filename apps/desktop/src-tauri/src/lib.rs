mod collector;

use collector::{load_cache, collect_and_cache, start_background_collector, WATCHLIST, WatchlistItem, CachedResult};
use std::path::PathBuf;
use tauri::Manager;

/// 获取本地缓存数据
#[tauri::command]
async fn get_cached_data(
    app_handle: tauri::AppHandle,
    code: String,
    market: String,
    period: String,
) -> Result<CachedResult, String> {
    let app_data_dir = get_app_data_dir(&app_handle);
    Ok(load_cache(&app_data_dir, &code, &market, &period))
}

/// 按需触发采集
#[tauri::command]
async fn trigger_fetch(
    app_handle: tauri::AppHandle,
    code: String,
    market: String,
    period: String,
    adjust: String,
) -> Result<(), String> {
    let app_data_dir = get_app_data_dir(&app_handle);
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(15))
        .build()
        .map_err(|e| format!("创建HTTP客户端失败: {}", e))?;

    collect_and_cache(&client, &app_data_dir, &code, &market, &period, &adjust).await
}

/// 前端推送 watchlist 给后端
#[tauri::command]
async fn set_watchlist(symbols: Vec<WatchlistItem>) -> Result<(), String> {
    let mut wl = WATCHLIST.write().await;
    *wl = symbols;
    eprintln!("[采集器] Watchlist 已更新，共 {} 只股票", wl.len());
    Ok(())
}

/// 获取缓存状态
#[tauri::command]
async fn get_cache_status(
    app_handle: tauri::AppHandle,
) -> Result<Vec<serde_json::Value>, String> {
    let app_data_dir = get_app_data_dir(&app_handle);
    let cache_dir = app_data_dir.join("cache");

    if !cache_dir.exists() {
        return Ok(Vec::new());
    }

    let mut status = Vec::new();
    if let Ok(entries) = std::fs::read_dir(&cache_dir) {
        for entry in entries.flatten() {
            if let Some(name) = entry.file_name().to_str() {
                if name.ends_with(".json") {
                    // 文件名格式: {market}_{code}_{period}.json
                    let parts: Vec<&str> = name.trim_end_matches(".json").split('_').collect();
                    if parts.len() >= 3 {
                        let market = parts[0];
                        let code = parts[1];
                        let period = parts[2];

                        let result = load_cache(&app_data_dir, code, market, period);
                        status.push(serde_json::json!({
                            "code": code,
                            "market": market,
                            "period": period,
                            "exists": result.exists,
                            "expired": result.expired,
                            "collectedAt": result.data.as_ref().map(|d| d.meta.collected_at.clone()),
                            "klineSource": result.data.as_ref().map(|d| d.meta.kline_source.clone()),
                        }));
                    }
                }
            }
        }
    }

    Ok(status)
}

/// 获取应用数据目录
fn get_app_data_dir(app_handle: &tauri::AppHandle) -> PathBuf {
    app_handle
        .path()
        .app_data_dir()
        .unwrap_or_else(|_| PathBuf::from("."))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_http::init())
        .setup(|app| {
            // 获取应用数据目录
            let app_data_dir = get_app_data_dir(app.handle());

            // 启动后台采集任务
            start_background_collector(app_data_dir);

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_cached_data,
            trigger_fetch,
            set_watchlist,
            get_cache_status,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
