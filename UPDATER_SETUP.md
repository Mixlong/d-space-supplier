# Tauri 自动更新配置

当前项目已接入并启用 updater 插件（`active: true`）。

## 1. 生成 updater 密钥

```bash
pnpm tauri signer generate -w ~/.tauri/d-space-updater.key
```

把输出的公钥填入：
- `src-tauri/tauri.conf.json` -> `plugins.updater.pubkey`

## 2. 配置更新清单地址

把更新清单地址填入：
- `src-tauri/tauri.conf.json` -> `plugins.updater.endpoints`

例如：
- `https://your-domain.com/tauri-updater/latest.json`

## 3. 前端触发检查

已提供：
- `src/updater.js` 中 `checkForAppUpdateWithPrompt()`

你可以在登录后或设置页点击“检查更新”时调用它。
