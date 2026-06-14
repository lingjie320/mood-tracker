#!/usr/bin/env bash
# Build 心情记录 as a macOS desktop app using Pake.
# Prereqs: Rust (cargo), Node, and pake-cli.
#   cargo install pake-cli
#
# Usage:  ./build.sh

set -euo pipefail

PORT=8765
NAME="心情记录"
WIDTH=600
HEIGHT=900

# Start a local static server in the background, pointed at this dir.
cd "$(dirname "$0")"
python3 -m http.server "$PORT" >/tmp/pake-mood-server.log 2>&1 &
SERVER_PID=$!
trap 'kill $SERVER_PID 2>/dev/null || true' EXIT

# Wait until the server is reachable.
for i in 1 2 3 4 5 6 7 8 9 10; do
  if curl -s "http://127.0.0.1:$PORT/index.html" >/dev/null 2>&1; then
    break
  fi
  sleep 0.3
done

# Run Pake. Use the pake-cli binary; falls back to cargo run if not in PATH.
URL="http://127.0.0.1:$PORT/index.html"

if command -v pake >/dev/null 2>&1; then
  pake "$URL" --name "$NAME" --width "$WIDTH" --height "$HEIGHT"
elif command -v pake-cli >/dev/null 2>&1; then
  pake-cli "$URL" --name "$NAME" --width "$WIDTH" --height "$HEIGHT"
else
  echo "pake CLI not found in PATH. Install with: cargo install pake-cli" >&2
  echo "Falling back to cargo run pake-cli -- ..." >&2
  cargo run --quiet --bin pake-cli -- "$URL" --name "$NAME" --width "$WIDTH" --height "$HEIGHT"
fi

echo
echo "Build complete. The .app bundle is in the project directory."
