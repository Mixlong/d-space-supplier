# Gitee Win 打包（Tauri）配置

当前项目是 Tauri（含 Rust），建议在码云使用 `Gitee + Jenkins(Windows 节点)` 打包 Windows 安装包。

## 1. 前置条件

- 一台可用的 Jenkins（建议 LTS）
- 至少一个 Windows Agent，且已安装：
  - Node.js 22+
  - pnpm 10+
  - Rust toolchain（`rustup` / `cargo`）
  - Visual Studio C++ Build Tools（MSVC）

## 2. Jenkins 配置

1. 新建 Pipeline Job（例如：`supplier-admin-win-build`）
2. Pipeline script from SCM
3. SCM 选择 Git，仓库地址填你的 Gitee 仓库地址
4. Script Path 填：`Jenkinsfile`
5. 保存后先手动 Build 一次

## 3. 码云触发 Jenkins（推荐）

在 Gitee 仓库配置 Webhook，指向 Jenkins 的 webhook 地址（通常为）：

`https://<jenkins-host>/gitee-project-<job-name>`

或使用 Jenkins Generic Webhook 插件自定义地址。

## 4. 构建产物位置

Jenkins 会自动归档以下安装包目录：

- `src-tauri/target/x86_64-pc-windows-msvc/release/bundle/nsis/`
- `src-tauri/target/x86_64-pc-windows-msvc/release/bundle/msi/`

## 5. 关键说明

- 应用名称与图标已在 `src-tauri/tauri.conf.json` 配置：
  - `productName`: `D-Space（供应商管理）`
  - Windows 图标：`src-tauri/icons/icon.ico`
  - macOS 图标：`src-tauri/icons/icon.icns`
