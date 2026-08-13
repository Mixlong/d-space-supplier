#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "[ERROR] missing command: $1"
    exit 1
  fi
}

require_env() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    echo "[ERROR] missing environment variable: $name"
    exit 1
  fi
}

detect_platform() {
  case "$(uname -s)" in
    Darwin) printf 'macos' ;;
    MINGW*|MSYS*|CYGWIN*) printf 'windows' ;;
    *)
      echo "[ERROR] unable to infer platform from $(uname -s). Set PLATFORM=macos or PLATFORM=windows." >&2
      exit 1
      ;;
  esac
}

upload() {
  local source="$1"
  local destination="$2"
  ossutil cp "$source" "$destination" --update
}

PLATFORM="${PLATFORM:-$(detect_platform)}"

require_cmd pnpm
require_cmd ossutil
require_cmd node
require_cmd find

require_env OSS_BASE
require_env OSS_PUBLIC_BASE
require_env TAURI_SIGNING_PRIVATE_KEY_PATH

if [[ ! -f "$TAURI_SIGNING_PRIVATE_KEY_PATH" ]]; then
  echo "[ERROR] signing key not found: $TAURI_SIGNING_PRIVATE_KEY_PATH"
  exit 1
fi

# Tauri reads the private key from this environment variable during bundling.
export TAURI_SIGNING_PRIVATE_KEY="$(<"$TAURI_SIGNING_PRIVATE_KEY_PATH")"

OSS_DIR="${OSS_DIR:-d-space/supplier-desktop}"
OSS_BASE="${OSS_BASE%/}"
OSS_PUBLIC_BASE="${OSS_PUBLIC_BASE%/}"

case "$PLATFORM" in
  macos)
    TARGET="${TARGET:-}"
    BUNDLES="${BUNDLES:-app,dmg}"
    if [[ -n "$TARGET" ]]; then
      pnpm tauri build --target "$TARGET" --bundles "$BUNDLES"
      BUNDLE_DIR="src-tauri/target/$TARGET/release/bundle"
    else
      pnpm tauri build --bundles "$BUNDLES"
      BUNDLE_DIR="src-tauri/target/release/bundle"
    fi

    DMG_FILE="$(find "$BUNDLE_DIR" -type f -name '*.dmg' | head -n 1 || true)"
    TAR_FILE="$(find "$BUNDLE_DIR" -type f -name '*.tar.gz' | head -n 1 || true)"
    SIG_FILE="$(find "$BUNDLE_DIR" -type f -name '*.tar.gz.sig' | head -n 1 || true)"
    if [[ -z "$DMG_FILE" || -z "$TAR_FILE" || -z "$SIG_FILE" ]]; then
      echo "[ERROR] missing macOS release artifacts (.dmg/.tar.gz/.tar.gz.sig)"
      exit 1
    fi

    PLATFORM_DIR="darwin"
    INSTALLER_NAME="supplier-D-Space.dmg"
    UPDATE_FILE_NAME="supplier-D-Space.tar.gz"
    UPDATE_SIG_NAME="supplier-D-Space.tar.gz.sig"
    INSTALLER_FILE="$DMG_FILE"
    UPDATE_FILE="$TAR_FILE"
    DESTINATIONS=("darwin" "darwin-aarch64" "darwin-x86_64")
    ;;
  windows)
    TARGET="${TARGET:-x86_64-pc-windows-msvc}"
    BUNDLES="${BUNDLES:-nsis}"
    pnpm tauri build --target "$TARGET" --bundles "$BUNDLES"
    BUNDLE_DIR="src-tauri/target/$TARGET/release/bundle"

    EXE_FILE="$(find "$BUNDLE_DIR" -type f -name '*.exe' | head -n 1 || true)"
    SIG_FILE="$(find "$BUNDLE_DIR" -type f -name '*.exe.sig' | head -n 1 || true)"
    if [[ -z "$EXE_FILE" || -z "$SIG_FILE" ]]; then
      echo "[ERROR] missing Windows release artifacts (.exe/.exe.sig)"
      exit 1
    fi

    PLATFORM_DIR="windows"
    INSTALLER_NAME="supplier-D-Space-x64-setup.exe"
    UPDATE_FILE_NAME="$INSTALLER_NAME"
    UPDATE_SIG_NAME="$INSTALLER_NAME.sig"
    INSTALLER_FILE="$EXE_FILE"
    UPDATE_FILE="$EXE_FILE"
    DESTINATIONS=("windows" "windows-x86_64" "windows-x86_64-msvc")
    ;;
  *)
    echo "[ERROR] unsupported PLATFORM: $PLATFORM (expected macos or windows)"
    exit 1
    ;;
esac

VERSION="$(node -p "require('./package.json').version")"
UPDATE_URL="$OSS_PUBLIC_BASE/$OSS_DIR/$PLATFORM_DIR/$UPDATE_FILE_NAME"
LATEST_JSON="$(mktemp "${TMPDIR:-/tmp}/supplier-admin-latest.XXXXXX")"
trap 'rm -f "$LATEST_JSON"' EXIT

node -e "const fs=require('fs');const [out, version, url, sigFile]=process.argv.slice(1);fs.writeFileSync(out, JSON.stringify({version,notes:'',pub_date:new Date().toISOString(),url,signature:fs.readFileSync(sigFile,'utf8').trim()}, null, 2)+'\\n');" "$LATEST_JSON" "$VERSION" "$UPDATE_URL" "$SIG_FILE"

echo "[INFO] platform: $PLATFORM"
echo "[INFO] version: $VERSION"
echo "[INFO] updater URL: $UPDATE_URL"

for destination in "${DESTINATIONS[@]}"; do
  DEST="$OSS_BASE/$OSS_DIR/$destination"
  upload "$INSTALLER_FILE" "$DEST/$INSTALLER_NAME"
  upload "$UPDATE_FILE" "$DEST/$UPDATE_FILE_NAME"
  upload "$SIG_FILE" "$DEST/$UPDATE_SIG_NAME"
  upload "$LATEST_JSON" "$DEST/latest.json"
done

echo "[OK] uploaded $PLATFORM release and updater manifest"
