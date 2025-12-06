use serde::{Deserialize, Serialize};
use sqlx::{sqlite::SqlitePool, Row};
use std::path::Path;

#[derive(Debug, Serialize, Deserialize)]
pub struct UsageStats {
    pub account_id: String,
    pub model: String,
    pub total_input: i64,
    pub total_output: i64,
    pub total_cache_creation: i64,
    pub total_cache_read: i64,
    pub total_requests: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AccountUsageSummary {
    pub account_id: String,
    pub total_input: i64,
    pub total_output: i64,
    pub total_requests: i64,
}

#[derive(Debug, Serialize)]
pub struct DatabaseInfo {
    pub path: String,
    pub exists: bool,
    pub size_bytes: u64,
    pub size_readable: String,
}

/// 查询指定天数内的使用量统计（按账户聚合）
#[tauri::command]
pub async fn get_usage_stats(
    db_path: String,
    days: Option<i32>,
) -> Result<Vec<AccountUsageSummary>, String> {
    let days = days.unwrap_or(7);

    if !Path::new(&db_path).exists() {
        return Ok(vec![]);
    }

    let database_url = format!("sqlite:{}?mode=ro", db_path); // 只读模式
    let pool = SqlitePool::connect(&database_url)
        .await
        .map_err(|e| format!("无法连接数据库: {}", e))?;

    let results = sqlx::query(
        r#"
        SELECT
            account_id,
            COALESCE(SUM(input_tokens), 0) as total_input,
            COALESCE(SUM(output_tokens), 0) as total_output,
            COUNT(*) as total_requests
        FROM usage_stats
        WHERE created_at >= datetime('now', ? || ' days')
        GROUP BY account_id
        ORDER BY total_output DESC
        "#,
    )
    .bind(-days)
    .fetch_all(&pool)
    .await
    .map_err(|e| format!("查询失败: {}", e))?;

    let stats = results
        .iter()
        .map(|row| AccountUsageSummary {
            account_id: row.get("account_id"),
            total_input: row.get("total_input"),
            total_output: row.get("total_output"),
            total_requests: row.get("total_requests"),
        })
        .collect();

    pool.close().await;
    Ok(stats)
}

/// 查询指定账户的详细统计（按模型分组）
#[tauri::command]
pub async fn get_account_usage_detail(
    db_path: String,
    account_id: String,
    days: Option<i32>,
) -> Result<Vec<UsageStats>, String> {
    let days = days.unwrap_or(7);

    if !Path::new(&db_path).exists() {
        return Ok(vec![]);
    }

    let database_url = format!("sqlite:{}?mode=ro", db_path);
    let pool = SqlitePool::connect(&database_url)
        .await
        .map_err(|e| format!("无法连接数据库: {}", e))?;

    let results = sqlx::query(
        r#"
        SELECT
            account_id,
            model,
            COALESCE(SUM(input_tokens), 0) as total_input,
            COALESCE(SUM(output_tokens), 0) as total_output,
            COALESCE(SUM(cache_creation_tokens), 0) as total_cache_creation,
            COALESCE(SUM(cache_read_tokens), 0) as total_cache_read,
            COUNT(*) as total_requests
        FROM usage_stats
        WHERE account_id = ?
        AND created_at >= datetime('now', ? || ' days')
        GROUP BY account_id, model
        ORDER BY total_output DESC
        "#,
    )
    .bind(&account_id)
    .bind(-days)
    .fetch_all(&pool)
    .await
    .map_err(|e| format!("查询失败: {}", e))?;

    let stats = results
        .iter()
        .map(|row| UsageStats {
            account_id: row.get("account_id"),
            model: row.get("model"),
            total_input: row.get("total_input"),
            total_output: row.get("total_output"),
            total_cache_creation: row.get("total_cache_creation"),
            total_cache_read: row.get("total_cache_read"),
            total_requests: row.get("total_requests"),
        })
        .collect();

    pool.close().await;
    Ok(stats)
}

/// 获取数据库文件信息
#[tauri::command]
pub async fn get_database_info(db_path: String) -> Result<DatabaseInfo, String> {
    use std::fs;

    let exists = Path::new(&db_path).exists();
    let size_bytes = if exists {
        fs::metadata(&db_path)
            .map(|m| m.len())
            .unwrap_or(0)
    } else {
        0
    };

    let size_readable = format_bytes(size_bytes);

    Ok(DatabaseInfo {
        path: db_path,
        exists,
        size_bytes,
        size_readable,
    })
}

/// 清理指定天数之前的统计数据
#[tauri::command]
pub async fn cleanup_old_stats(db_path: String, days: i32) -> Result<u64, String> {
    if !Path::new(&db_path).exists() {
        return Err("数据库文件不存在".to_string());
    }

    // 注意：这里使用读写模式，因为需要删除数据
    let database_url = format!("sqlite:{}", db_path);
    let pool = SqlitePool::connect(&database_url)
        .await
        .map_err(|e| format!("无法连接数据库: {}", e))?;

    let result = sqlx::query(
        r#"
        DELETE FROM usage_stats
        WHERE created_at < datetime('now', ? || ' days')
        "#,
    )
    .bind(-days)
    .execute(&pool)
    .await
    .map_err(|e| format!("删除失败: {}", e))?;

    pool.close().await;
    Ok(result.rows_affected())
}

fn format_bytes(bytes: u64) -> String {
    const KB: u64 = 1024;
    const MB: u64 = KB * 1024;
    const GB: u64 = MB * 1024;

    if bytes >= GB {
        format!("{:.2} GB", bytes as f64 / GB as f64)
    } else if bytes >= MB {
        format!("{:.2} MB", bytes as f64 / MB as f64)
    } else if bytes >= KB {
        format!("{:.2} KB", bytes as f64 / KB as f64)
    } else {
        format!("{} B", bytes)
    }
}
