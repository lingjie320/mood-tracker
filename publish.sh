#!/usr/bin/env bash
# publish.sh — initialize the local git repo and push to GitHub.
#
# Prereqs: create an EMPTY repo at https://github.com/lingjie320/mood-tracker
# (do NOT initialize it with a README/.gitignore — that causes push rejection).
#
# Then run this from the project root:
#   ./publish.sh

set -euo pipefail

REMOTE_URL="https://github.com/lingjie320/mood-tracker.git"
PAGES_URL="https://lingjie320.github.io/mood-tracker/"

cd "$(dirname "$0")"

if [ ! -d .git ]; then
  git init -b main
fi

git config user.name  "${GIT_USER_NAME:-lingjieli}"
git config user.email "${GIT_USER_EMAIL:-lingjieli@users.noreply.github.com}"

git add -A
git status --short

# Allow passing a commit message; default to the obvious one.
MSG="${1:-Initial commit: 心情记录 PWA (mood tracker with notes, calendar, stats)}"
git commit -m "$MSG"

if ! git remote get-url origin >/dev/null 2>&1; then
  git remote add origin "$REMOTE_URL"
fi

git branch -M main
git push -u origin main

cat <<EOF

✅ Pushed.

Next, enable GitHub Pages:
  1. Open https://github.com/lingjie320/mood-tracker/settings/pages
  2. Source: "Deploy from a branch"  ·  Branch: main  ·  Folder: / (root)
  3. Save. Wait ~30 seconds.
  4. Your app is live at:
       $PAGES_URL
EOF
