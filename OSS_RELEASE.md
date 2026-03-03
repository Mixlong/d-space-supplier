# OSS 发布命令

## 1. 先配置环境变量

```bash
export OSS_BASE="oss://your-bucket/tauri-updater"
export OSS_DIR="d-space/supplier-desktop"
export TAURI_SIGNING_PRIVATE_KEY_PATH="$HOME/.tauri/d-space-updater.key"
export TAURI_SIGNING_PRIVATE_KEY_PASSWORD="你的私钥密码"
```

可选：

```bash
export TARGET="x86_64-pc-windows-msvc"
export BUNDLES="nsis"
```

## 2. 一条命令发布

```bash
cd /Users/dragons/Desktop/project/supplier-admin
pnpm release:oss
```

脚本会自动：
1. 执行 `tauri build` 生成安装包与更新签名
2. 查找 `.exe` / `.sig` / `latest.json`
3. 上传到 `${OSS_BASE}/${OSS_DIR}/`

最终更新地址示例：
- `https://your-cdn-domain/tauri-updater/d-space/supplier-desktop/latest.json`
