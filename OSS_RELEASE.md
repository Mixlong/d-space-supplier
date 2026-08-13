# 本机 OSS 发布与在线更新

OSS 启用了来源 IP 白名单，因此构建和上传必须在已加入白名单的本机网络中完成。不要使用 GitHub Actions 的 `publish_to_oss`，云端 Runner 不会通过该白名单。

## 一键发布

```bash
pnpm release:all
```

默认升补丁版本，例如 `1.0.0` 到 `1.0.1`，并自动完成提交、推送、双端 GitHub 构建、下载 Artifact 和本机 OSS 上传。需要升小版本或大版本时：

```bash
pnpm release:all minor
pnpm release:all major
```

执行前仅允许存在 `artifacts/` 本地下载目录；其他改动必须先提交。

## 推荐流程：GitHub 打包，本机上传

在 GitHub Actions 分别手动执行 `Windows Tauri Build` 和 `macOS Tauri Build`，两次都保持 `publish_to_oss=false`。构建工作流不需要配置 OSS 凭证，但必须配置 `TAURI_SIGNING_PRIVATE_KEY` 与 `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`，否则不会产生在线更新所需的 `.sig` 文件。

两个任务成功后，在这台白名单 Mac 上执行：

```bash
pnpm release:oss:github-artifacts -- --windows-run <Windows-Run-ID> --macos-run <macOS-Run-ID>
```

脚本会通过已登录的 GitHub CLI 下载 `windows-nsis` 与 `macos-app-dmg` Artifact，读取构建时的版本号，生成平台对应 `latest.json`，然后从本机上传 OSS。

也可以单独发布一个平台：

```bash
pnpm release:oss:github-artifacts -- --windows-run <Windows-Run-ID>
pnpm release:oss:github-artifacts -- --macos-run <macOS-Run-ID>
```

GitHub 下载超时时，可先手动下载 Artifact 后直接上传：

```bash
pnpm release:oss:github-artifacts -- --windows-dir ./artifacts/windows
pnpm release:oss:github-artifacts -- --macos-dir ./artifacts/macos
```

## 本机打包发布

- macOS 包可以在这台 Mac 上构建和发布。
- Windows 包由 GitHub 的 Windows Runner 构建；macOS 本机只下载 Artifact 后上传。

## 一次性准备

安装 `pnpm`、Rust、Tauri 所需系统依赖，以及已完成认证的 `ossutil`。将 Tauri updater 私钥保存在本机安全位置；它必须与 `src-tauri/tauri.conf.json` 中的公钥配对，不能在发布后随意更换。

在本机 shell 设置环境变量：

```bash
export OSS_BASE="oss://bikewise"
export OSS_PUBLIC_BASE="https://bikewise.oss-cn-shenzhen.aliyuncs.com"
export OSS_DIR="d-space/supplier-desktop"
export OSS_REGION="cn-shenzhen"
export TAURI_SIGNING_PRIVATE_KEY_PATH="$HOME/.tauri/d-space-updater.key"
export TAURI_SIGNING_PRIVATE_KEY_PASSWORD="私钥密码"
```

`OSS_BASE` 是 `ossutil` 的目标路径；`OSS_PUBLIC_BASE` 是客户端可以访问的 HTTPS 域名，可以填写 OSS 公网域名或已配置 HTTPS 的 CDN 域名。两者不是同一个格式，且 `OSS_PUBLIC_BASE` 不能是内网 endpoint。

## 发布 macOS

先提升 `package.json` 中的版本号，再从此应用目录执行：

```bash
pnpm release:oss:macos
```

脚本会生成带 `supplier-` 前缀的 `DMG` 供首次安装、`tar.gz` 供自动更新，并上传到以下路径：

```text
d-space/supplier-desktop/darwin/
d-space/supplier-desktop/darwin-aarch64/
d-space/supplier-desktop/darwin-x86_64/
```

三个目录都会有 `latest.json`，以兼容 Tauri 在不同 macOS 架构上生成的 updater target。正式面向外部 Mac 用户时，还需要 Apple Developer 签名和公证。

## 发布 Windows

在原生 Windows 或 Windows 虚拟机的 Git Bash 中，使用相同项目代码、同一份签名私钥和同一组 OSS 配置执行：

```bash
pnpm release:oss:windows
```

会生成 NSIS 安装程序并上传 `windows`、`windows-x86_64`、`windows-x86_64-msvc` 三个 updater 目录。

## 验证

发布后检查以下地址返回新版版本号，且 `url` 是 HTTPS 可下载地址：

```text
https://bikewise.oss-cn-shenzhen.aliyuncs.com/d-space/supplier-desktop/darwin/latest.json
https://bikewise.oss-cn-shenzhen.aliyuncs.com/d-space/supplier-desktop/windows/latest.json
```

使用低版本应用启动后会自动检查更新。macOS 应用必须先安装到 `/Applications` 后再更新。
