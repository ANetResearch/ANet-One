<div align="center">

<img src="packages/desktop/build/icons/256x256.png" alt="ANet One" width="112" height="112" />

# ANet One

**An open-source AI workbench — desktop app, browser UI, and terminal agent.**

[![Release](https://img.shields.io/github/v/release/ANetResearch/ANet-One?include_prereleases&sort=semver)](https://github.com/ANetResearch/ANet-One/releases)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue)](LICENSE)
[![Platforms](https://img.shields.io/badge/platforms-macOS%20arm64%20%7C%20Windows%20x64%20%7C%20Linux%20x64-lightgrey)](https://github.com/ANetResearch/ANet-One/releases)

English | [简体中文](README.zh-CN.md)

[**Download**](https://github.com/ANetResearch/ANet-One/releases) · [Office skills](delivery/workdesk/README.md)

</div>

---

## One workbench, three shapes

| Shape        | What it is                                                     |
| ------------ | -------------------------------------------------------------- |
| **Desktop**  | File tree, editor, embedded browser, terminal — in one window. |
| **Browser**  | The same UI over HTTP, for working on a remote machine.        |
| **Terminal** | A headless agent (`anet -p "…"`) for scripts, CI, and SSH.     |

All three share the same sessions and workspace. It edits files and runs commands,
and it also keeps project ledgers, writes weekly reports, prepares handovers, and
builds slide decks.

## Install

From [Releases](https://github.com/ANetResearch/ANet-One/releases):

| Platform              | File                                               |
| --------------------- | -------------------------------------------------- |
| macOS (Apple Silicon) | `.dmg`                                             |
| Windows x64           | `.exe`                                             |
| Linux x64             | `.AppImage`, `.deb`                                |
| Terminal agent        | `anet-one-cli-<version>.tar.gz` (needs Node.js 24) |

```bash
tar -xzf anet-one-cli-<version>.tar.gz
node anet-one-cli.cjs -p "hello"
```

Keep `provider/` next to `anet-one-cli.cjs`; the agent reads its bundled config from there.

macOS builds are not notarized — on first launch, allow the app under
**System Settings → Privacy & Security**. Intel Macs are not published; to build one:
`pnpm --filter @anet/desktop exec electron-builder --mac --x64`.

## Connect a model

Paste a token into **Settings → Model providers**. Any OpenAI- or
Anthropic-compatible endpoint works. One channel is pre-filled so a token is all
you need.

## Office skills

Plain Markdown under [`delivery/workdesk/`](delivery/workdesk/) — read them, change
them, add your own.

| Skill            | Input → output                                                   |
| ---------------- | ---------------------------------------------------------------- |
| `project-ledger` | Notes and chat logs → a task ledger with owners and blockers     |
| `weekly-report`  | Scattered notes → a weekly report, fact separated from inference |
| `handover`       | A project's history → a handover document                        |
| `research-notes` | Links → an indexed library with a verification status per item   |
| `one-pager`      | A long discussion → one page a decision-maker can act on         |
| `deck`           | A conclusion plus evidence → an editable deck                    |
| `concept-image`  | A described scene → a generated illustration                     |

Each skill records where a number came from, and marks what it has not verified.

## Network behavior

No service this project operates is compiled in as a destination the app calls on
its own. Remote control, session sharing, config fetch, and OAuth sign-in all
resolve to an empty address until you set one, and make no request while empty. The
one address that does ship is a model endpoint in the channel catalog. A test
enforces this:

```bash
pnpm vitest run --project engineering packages/shared/test/noVendorEndpoints.test.ts
```

## Build from source

Node.js **24.14.0**, pnpm **10.33.2** (see [`mise.toml`](mise.toml)).

```bash
pnpm install
pnpm run build:bootstrap
pnpm run typecheck
pnpm vitest run --project engineering               # desktop / web / shared
pnpm --filter anet-cli run test                    # terminal agent
pnpm dev:desktop        # run the desktop app
pnpm dev:web            # run the browser UI
```

Remote control, session sharing, and OAuth need a server of your own. Fill in
[`.env.example`](.env.example) and rebuild; leave the keys empty and those features
stay off.

## License

[Apache-2.0](LICENSE). A modified distribution of an upstream Apache-2.0 project;
upstream notices are kept in [`LICENSE`](LICENSE) and
[`THIRD-PARTY-NOTICES.md`](THIRD-PARTY-NOTICES.md).
