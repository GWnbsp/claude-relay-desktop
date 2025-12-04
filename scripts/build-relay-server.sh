#!/bin/bash
# 构建 cc-relay-server 二进制文件供开发使用

set -e

echo "Building cc-relay-server..."

cd "$(dirname "$0")/.."

# 构建 relay-server
cargo build --bin cc-relay-server

echo "✓ cc-relay-server built successfully at target/debug/cc-relay-server"
echo ""
echo "For production build, use:"
echo "  cargo build --release --bin cc-relay-server"
