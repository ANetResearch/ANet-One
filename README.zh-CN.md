<div align="center">

<img src="packages/desktop/build/icons/256x256.png" alt="ANet One" width="112" height="112" />

# ANet One

**开源 AI 工作台 —— 桌面应用、浏览器界面、终端 Agent。**

[![Release](https://img.shields.io/github/v/release/ANetResearch/ANet-One?include_prereleases&sort=semver)](https://github.com/ANetResearch/ANet-One/releases)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue)](LICENSE)
[![Platforms](https://img.shields.io/badge/platforms-macOS%20arm64%20%7C%20Windows%20x64%20%7C%20Linux%20x64-lightgrey)](https://github.com/ANetResearch/ANet-One/releases)

[English](README.md) | 简体中文

[**下载**](https://github.com/ANetResearch/ANet-One/releases) · [办公技能](delivery/workdesk/README.md)

</div>

---

## 一套工作台，三种形态

| 形态         | 是什么                                              |
| ------------ | --------------------------------------------------- |
| **桌面版**   | 文件树、编辑器、内嵌浏览器、终端，在一个窗口里      |
| **浏览器版** | 同一套界面经 HTTP 提供，用来操作远端机器            |
| **终端版**   | 无界面 Agent（`anet -p "…"`），给脚本、CI 和 SSH 用 |

三者共享同一份会话与工作区。它能改文件、跑命令，也能维护项目台账、写周报、
准备交接文档、做幻灯片。

## 安装

从 [Releases](https://github.com/ANetResearch/ANet-One/releases) 下载：

| 平台                   | 文件                                            |
| ---------------------- | ----------------------------------------------- |
| macOS（Apple Silicon） | `.dmg`                                          |
| Windows x64            | `.exe`                                          |
| Linux x64              | `.AppImage`、`.deb`                             |
| 终端 Agent             | `anet-one-cli-<版本>.tar.gz`（需要 Node.js 24） |

```bash
tar -xzf anet-one-cli-<版本>.tar.gz
node anet-one-cli.cjs -p "hello"
```

`provider/` 要和 `anet-one-cli.cjs` 放在一起，Agent 从那里读随包配置。

macOS 安装包未经 Apple 公证，首次打开请在**系统设置 → 隐私与安全性**里放行。
不发 Intel Mac 版本；要自己构建：`pnpm --filter @anet/desktop exec electron-builder --mac --x64`。

## 接模型

在**设置 → 模型供应商**里粘贴一个 token 即可。支持任何 OpenAI 或 Anthropic
兼容端点。有一条渠道已经预填好，只需填 token。

## 办公技能

就是 [`delivery/workdesk/`](delivery/workdesk/) 下的 Markdown 文件，可读、可改、可自己加。

| 技能             | 输入 → 输出                                     |
| ---------------- | ----------------------------------------------- |
| `project-ledger` | 会议记录、聊天记录 → 带责任人和阻塞项的任务台账 |
| `weekly-report`  | 零散记录 → 周报，事实与推断分开写               |
| `handover`       | 项目历史 → 交接文档                             |
| `research-notes` | 链接 → 带逐条核实状态的资料库                   |
| `one-pager`      | 一长串讨论 → 决策者能直接用的一页               |
| `deck`           | 结论加证据 → 可编辑的幻灯片                     |
| `concept-image`  | 一段场景描述 → 生成插图                         |

每个技能都会记下数字的来源，并标出哪些还没核实过。

## 网络行为

本项目运营的服务，没有任何一个被编进程序作为它自己会去访问的地址。远程控制、
会话分享、配置拉取、OAuth 登录在你配置之前都解析为空地址，为空时不发任何请求。
随包发布的唯一一个地址是渠道目录里的一条模型端点。有测试守着这一点：

```bash
pnpm vitest run --project engineering packages/shared/test/noVendorEndpoints.test.ts
```

## 从源码构建

需要 Node.js **24.14.0**、pnpm **10.33.2**（见 [`mise.toml`](mise.toml)）。

```bash
pnpm install
pnpm run build:bootstrap
pnpm run typecheck
pnpm vitest run --project engineering               # 桌面 / Web / 共享
pnpm --filter anet-cli run test                    # 终端 Agent
pnpm dev:desktop        # 跑桌面应用
pnpm dev:web            # 跑浏览器界面
```

远程控制、会话分享和 OAuth 需要你自己的服务端。填好
[`.env.example`](.env.example) 再构建；留空则这些功能保持关闭。

## 许可

[Apache-2.0](LICENSE)。本项目是一个上游 Apache-2.0 项目的修改分发版，上游署名
保留在 [`LICENSE`](LICENSE) 与 [`THIRD-PARTY-NOTICES.md`](THIRD-PARTY-NOTICES.md) 中。
