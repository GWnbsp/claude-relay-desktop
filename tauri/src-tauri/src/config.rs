use serde::Deserialize;

#[derive(Debug, Clone, Deserialize)]
pub struct Config {
    pub server: ServerConfig,
    #[serde(default)]
    pub api_keys: Vec<String>,
    #[serde(default)]
    pub accounts: Vec<AccountConfig>,
    #[serde(default)]
    pub session: SessionConfig,
}

#[derive(Debug, Clone, Deserialize)]
pub struct ServerConfig {
    #[serde(default = "default_host")]
    pub host: String,
    #[serde(default = "default_port")]
    pub port: u16,
    #[serde(default = "default_db_path")]
    pub database_path: String,
    #[serde(default = "default_log_level")]
    pub log_level: String,
}

fn default_host() -> String {
    "127.0.0.1".to_string()
}
fn default_port() -> u16 {
    3000
}
fn default_db_path() -> String {
    "data/relay.db".to_string()
}
fn default_log_level() -> String {
    "info".to_string()
}

#[derive(Debug, Clone, Deserialize)]
#[serde(tag = "type", rename_all = "kebab-case")]
pub enum AccountConfig {
    ClaudeOauth {
        id: String,
        name: String,
        #[serde(default = "default_priority")]
        priority: u32,
        #[serde(default = "default_enabled")]
        enabled: bool,
        refresh_token: String,
        #[serde(default)]
        api_url: Option<String>,
        #[serde(default)]
        proxy: Option<ProxyConfig>,
    },
    ClaudeApi {
        id: String,
        name: String,
        #[serde(default = "default_priority")]
        priority: u32,
        #[serde(default = "default_enabled")]
        enabled: bool,
        api_key: String,
        #[serde(default)]
        api_url: Option<String>,
        #[serde(default)]
        proxy: Option<ProxyConfig>,
    },
    Gemini {
        id: String,
        name: String,
        #[serde(default = "default_priority")]
        priority: u32,
        #[serde(default = "default_enabled")]
        enabled: bool,
        refresh_token: String,
        #[serde(default)]
        api_url: Option<String>,
        #[serde(default)]
        proxy: Option<ProxyConfig>,
    },
    OpenaiResponses {
        id: String,
        name: String,
        #[serde(default = "default_priority")]
        priority: u32,
        #[serde(default = "default_enabled")]
        enabled: bool,
        api_key: String,
        #[serde(default)]
        api_url: Option<String>,
        #[serde(default)]
        proxy: Option<ProxyConfig>,
    },
}

fn default_priority() -> u32 {
    100
}
fn default_enabled() -> bool {
    true
}

#[derive(Debug, Clone, Deserialize, Default)]
pub struct SessionConfig {
    #[serde(default = "default_sticky_ttl")]
    pub sticky_ttl_seconds: u64,
    #[serde(default = "default_renewal_threshold")]
    pub renewal_threshold_seconds: u64,
}

fn default_sticky_ttl() -> u64 {
    3600
}
fn default_renewal_threshold() -> u64 {
    300
}

#[derive(Debug, Clone, Deserialize)]
#[serde(tag = "type", rename_all = "lowercase")]
pub enum ProxyConfig {
    Socks5 {
        host: String,
        port: u16,
        #[serde(default)]
        username: Option<String>,
        #[serde(default)]
        password: Option<String>,
    },
    Http {
        host: String,
        port: u16,
        #[serde(default)]
        username: Option<String>,
        #[serde(default)]
        password: Option<String>,
    },
    None,
}

impl ProxyConfig {
    pub fn is_none(&self) -> bool {
        matches!(self, ProxyConfig::None)
    }
}

impl Config {
    pub fn load(path: &str) -> Result<Self, String> {
        let content = std::fs::read_to_string(path)
            .map_err(|e| format!("Failed to read config {}: {}", path, e))?;
        Self::load_from_str(&content)
    }

    pub fn load_from_str(content: &str) -> Result<Self, String> {
        toml::from_str::<Config>(content).map_err(|e| format!("Config parse error: {}", e))
    }
}
