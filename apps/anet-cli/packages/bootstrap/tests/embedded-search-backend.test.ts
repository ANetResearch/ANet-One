import { describe, expect, it } from "vitest";
import { resolveDefaultEmbeddedSearchBackend } from "../src/app/embedded-search-backend.js";

describe("resolveDefaultEmbeddedSearchBackend", () => {
  it("uses bundled bfs, ugrep, and ripgrep paths by default", () => {
    expect(
      resolveDefaultEmbeddedSearchBackend({
        env: {
          ANET_BFS_BINARY: "/opt/anet/tools/bfs/bfs",
          ANET_RG_BINARY: "/opt/anet/tools/ripgrep/rg",
          ANET_UGREP_BINARY: "/opt/anet/tools/ugrep/ugrep",
        },
      }),
    ).toEqual({
      kind: "native-binaries",
      findCommand: "/opt/anet/tools/bfs/bfs",
      grepCommand: "/opt/anet/tools/ugrep/ugrep",
      rgCommand: "/opt/anet/tools/ripgrep/rg",
    });
  });

  it("falls back to bfs, ugrep, and rg command names when bundled paths are unavailable", () => {
    expect(resolveDefaultEmbeddedSearchBackend({ env: {} })).toEqual({
      kind: "native-binaries",
      findCommand: "bfs",
      grepCommand: "ugrep",
      rgCommand: "rg",
    });
  });

  it("preserves the explicit internal CLI compatibility override", () => {
    expect(
      resolveDefaultEmbeddedSearchBackend({
        env: { ANET_EMBEDDED_SEARCH_COMMAND: "/tmp/anet-test" },
      }),
    ).toEqual({
      kind: "internal-cli",
      command: "/tmp/anet-test",
      args: ["__internal-search"],
    });
  });
});
