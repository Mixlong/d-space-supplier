#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

RELEASE_TYPE="${1:-patch}"
case "$RELEASE_TYPE" in
  patch|minor|major) ;;
  *)
    echo "Usage: pnpm release:all [patch|minor|major]"
    exit 1
    ;;
esac

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "[ERROR] missing command: $1"
    exit 1
  fi
}

require_cmd git
require_cmd gh
require_cmd pnpm
require_cmd ossutil

if [[ -n "$(git status --porcelain --untracked-files=all | grep -v '^?? artifacts/' || true)" ]]; then
  echo "[ERROR] commit or stash your changes before releasing."
  exit 1
fi

git pull --ff-only origin master
pnpm version "$RELEASE_TYPE" --no-git-tag-version
pnpm sync:tauri-version

VERSION="$(node -p "require('./package.json').version")"
git add package.json src-tauri/tauri.conf.json
git commit -m "chore(supplier): release v$VERSION"
git push origin master

COMMIT_SHA="$(git rev-parse HEAD)"
gh workflow run "Windows Tauri Build" --ref master -f publish_to_oss=false
gh workflow run "macOS Tauri Build" --ref master -f publish_to_oss=false

find_run_id() {
  local workflow="$1"
  local run_id=""
  for _ in {1..30}; do
    run_id="$(gh run list --workflow "$workflow" --branch master --commit "$COMMIT_SHA" --event workflow_dispatch --limit 1 --json databaseId --jq '.[0].databaseId // empty')"
    if [[ -n "$run_id" ]]; then
      printf '%s' "$run_id"
      return 0
    fi
    sleep 2
  done
  echo "[ERROR] unable to find triggered $workflow run" >&2
  return 1
}

WINDOWS_RUN_ID="$(find_run_id "Windows Tauri Build")"
MACOS_RUN_ID="$(find_run_id "macOS Tauri Build")"

echo "[INFO] waiting for Windows build: $WINDOWS_RUN_ID"
gh run watch "$WINDOWS_RUN_ID" --exit-status --compact
echo "[INFO] waiting for macOS build: $MACOS_RUN_ID"
gh run watch "$MACOS_RUN_ID" --exit-status --compact

export OSS_BASE="${OSS_BASE:-oss://bikewise}"
export OSS_PUBLIC_BASE="${OSS_PUBLIC_BASE:-https://bikewise.oss-cn-shenzhen.aliyuncs.com}"
export OSS_DIR="${OSS_DIR:-d-space/supplier-desktop}"
export OSS_REGION="${OSS_REGION:-cn-shenzhen}"

pnpm release:oss:github-artifacts -- --windows-run "$WINDOWS_RUN_ID" --macos-run "$MACOS_RUN_ID"
echo "[OK] released supplier desktop v$VERSION"
