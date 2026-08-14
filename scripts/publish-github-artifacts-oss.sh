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

upload() {
  ossutil --region "$OSS_REGION" cp "$1" "$2" --update
}

release_version() {
  node -e "const fs=require('fs');const p=process.argv[1];const v=JSON.parse(fs.readFileSync(p,'utf8')).version;if(!v)process.exit(1);process.stdout.write(v);" "$1"
}

publish_windows() {
  local artifact_dir="$1"
  local package_json exe_file sig_file version latest_json destination
  package_json="$(find "$artifact_dir" -type f -name package.json | head -n 1 || true)"
  exe_file="$(find "$artifact_dir" -type f -name '*.exe' | head -n 1 || true)"
  sig_file="$(find "$artifact_dir" -type f -name '*.exe.sig' | head -n 1 || true)"
  if [[ -z "$package_json" || -z "$exe_file" || -z "$sig_file" ]]; then
    echo "[ERROR] Windows artifact must contain package.json, .exe, and .exe.sig"
    exit 1
  fi

  version="$(release_version "$package_json")"
  latest_json="$(mktemp "${TMPDIR:-/tmp}/supplier-admin-windows.XXXXXX")"
  node -e "const fs=require('fs');const [out, version, url, sigFile]=process.argv.slice(1);fs.writeFileSync(out,JSON.stringify({version,notes:'',pub_date:new Date().toISOString(),url,signature:fs.readFileSync(sigFile,'utf8').trim()},null,2)+'\\n');" "$latest_json" "$version" "$OSS_PUBLIC_BASE/$OSS_DIR/windows/supplier-D-Space-x64-setup.exe" "$sig_file"

  echo "[INFO] publishing Windows $version"
  for destination in windows windows-x86_64 windows-x86_64-msvc; do
    upload "$exe_file" "$OSS_BASE/$OSS_DIR/$destination/supplier-D-Space-x64-setup.exe"
    upload "$sig_file" "$OSS_BASE/$OSS_DIR/$destination/supplier-D-Space-x64-setup.exe.sig"
    upload "$latest_json" "$OSS_BASE/$OSS_DIR/$destination/latest.json"
  done
}

publish_macos() {
  local artifact_dir="$1"
  local package_json dmg_file tar_file sig_file version latest_json destination
  package_json="$(find "$artifact_dir" -type f -name package.json | head -n 1 || true)"
  dmg_file="$(find "$artifact_dir" -type f -name '*.dmg' | head -n 1 || true)"
  tar_file="$(find "$artifact_dir" -type f -name '*.tar.gz' | head -n 1 || true)"
  sig_file="$(find "$artifact_dir" -type f -name '*.tar.gz.sig' | head -n 1 || true)"
  if [[ -z "$package_json" || -z "$dmg_file" || -z "$tar_file" || -z "$sig_file" ]]; then
    echo "[ERROR] macOS artifact must contain package.json, .dmg, .tar.gz, and .tar.gz.sig"
    exit 1
  fi

  version="$(release_version "$package_json")"
  latest_json="$(mktemp "${TMPDIR:-/tmp}/supplier-admin-macos.XXXXXX")"
  node -e "const fs=require('fs');const [out, version, url, sigFile]=process.argv.slice(1);fs.writeFileSync(out,JSON.stringify({version,notes:'',pub_date:new Date().toISOString(),url,signature:fs.readFileSync(sigFile,'utf8').trim()},null,2)+'\\n');" "$latest_json" "$version" "$OSS_PUBLIC_BASE/$OSS_DIR/darwin/supplier-D-Space.tar.gz" "$sig_file"

  echo "[INFO] publishing macOS $version"
  for destination in darwin darwin-aarch64 darwin-x86_64; do
    upload "$dmg_file" "$OSS_BASE/$OSS_DIR/$destination/supplier-D-Space.dmg"
    upload "$tar_file" "$OSS_BASE/$OSS_DIR/$destination/supplier-D-Space.tar.gz"
    upload "$sig_file" "$OSS_BASE/$OSS_DIR/$destination/supplier-D-Space.tar.gz.sig"
    upload "$latest_json" "$OSS_BASE/$OSS_DIR/$destination/latest.json"
  done
}

WINDOWS_RUN_ID=""
MACOS_RUN_ID=""
WINDOWS_ARTIFACT_DIR=""
MACOS_ARTIFACT_DIR=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --) shift ;;
    --windows-run) WINDOWS_RUN_ID="${2:-}"; shift 2 ;;
    --macos-run) MACOS_RUN_ID="${2:-}"; shift 2 ;;
    --windows-dir) WINDOWS_ARTIFACT_DIR="${2:-}"; shift 2 ;;
    --macos-dir) MACOS_ARTIFACT_DIR="${2:-}"; shift 2 ;;
    *) echo "[ERROR] unknown argument: $1"; exit 1 ;;
  esac
done

if [[ -z "$WINDOWS_RUN_ID" && -z "$MACOS_RUN_ID" && -z "$WINDOWS_ARTIFACT_DIR" && -z "$MACOS_ARTIFACT_DIR" ]]; then
  echo "Usage: $0 --windows-run <run-id> [--macos-run <run-id>]"
  echo "   or: $0 --windows-dir <artifact-dir> [--macos-dir <artifact-dir>]"
  exit 1
fi

require_cmd ossutil
require_cmd node
require_cmd find

OSS_BASE="${OSS_BASE:-oss://bikewise}"
OSS_PUBLIC_BASE="${OSS_PUBLIC_BASE:-https://bikewise.oss-cn-shenzhen.aliyuncs.com}"
OSS_BASE="${OSS_BASE%/}"
OSS_PUBLIC_BASE="${OSS_PUBLIC_BASE%/}"
OSS_DIR="${OSS_DIR:-d-space/supplier-desktop}"
OSS_REGION="${OSS_REGION:-cn-shenzhen}"
ARTIFACT_DIR="$(mktemp -d "${TMPDIR:-/tmp}/supplier-admin-artifacts.XXXXXX")"

if [[ -n "$WINDOWS_ARTIFACT_DIR" ]]; then
  publish_windows "$WINDOWS_ARTIFACT_DIR"
elif [[ -n "$WINDOWS_RUN_ID" ]]; then
  require_cmd gh
  gh run download "$WINDOWS_RUN_ID" --name windows-nsis --dir "$ARTIFACT_DIR/windows"
  publish_windows "$ARTIFACT_DIR/windows"
fi

if [[ -n "$MACOS_ARTIFACT_DIR" ]]; then
  publish_macos "$MACOS_ARTIFACT_DIR"
elif [[ -n "$MACOS_RUN_ID" ]]; then
  require_cmd gh
  gh run download "$MACOS_RUN_ID" --name macos-app-dmg --dir "$ARTIFACT_DIR/macos"
  publish_macos "$ARTIFACT_DIR/macos"
fi

echo "[OK] GitHub build artifacts were uploaded to OSS from this machine"
