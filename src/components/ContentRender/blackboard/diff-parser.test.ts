import { describe, expect, it } from "vitest";
import { parseBlackboardStream } from "./diff-parser";

describe("parseBlackboardStream", () => {
  it("extracts html and unified diff blocks", () => {
    const source = `<div class="slide"><h1>Hello</h1></div>
!+++
--- a/0
+++ b/0
@@ -1,1 +1,1 @@
-<div class="slide"><h1>Hello</h1></div>
+<div class="slide"><h1>World</h1></div>
!+++`;

    const parsed = parseBlackboardStream(source);

    expect(parsed.hasUnclosedDiffBlock).toBe(false);
    expect(parsed.isPureDiffPayload).toBe(false);
    expect(parsed.htmlBlocks).toHaveLength(1);
    expect(parsed.diffBlocks).toHaveLength(1);
    expect(parsed.diffBlocks[0]).toContain("--- a/0");
    expect(parsed.diffBlocks[0]).toContain("+++ b/0");
  });

  it("guards when diff block is not closed", () => {
    const source = `!+++
--- a/0
+++ b/0
@@ -1,1 +1,1 @@
-<div>A</div>
+<div>B</div>`;

    const parsed = parseBlackboardStream(source);

    expect(parsed.hasUnclosedDiffBlock).toBe(true);
    expect(parsed.isPureDiffPayload).toBe(false);
    expect(parsed.htmlBlocks).toHaveLength(0);
    expect(parsed.diffBlocks).toHaveLength(0);
  });

  it("keeps pending html when the final block is incomplete", () => {
    const source = `<div><h1>Complete</h1></div>
<div><h2>Pending`;

    const parsed = parseBlackboardStream(source);

    expect(parsed.hasUnclosedDiffBlock).toBe(false);
    expect(parsed.isPureDiffPayload).toBe(false);
    expect(parsed.htmlBlocks).toHaveLength(1);
    expect(parsed.pendingHTML).toContain("<div><h2>Pending");
  });

  it("detects payload with only diff blocks", () => {
    const source = `!+++
--- a/0
+++ b/0
@@ -1,1 +1,1 @@
-<div>A</div>
+<div>B</div>
!+++`;

    const parsed = parseBlackboardStream(source);

    expect(parsed.hasUnclosedDiffBlock).toBe(false);
    expect(parsed.isPureDiffPayload).toBe(true);
    expect(parsed.htmlBlocks).toHaveLength(0);
    expect(parsed.diffBlocks).toHaveLength(1);
  });
});
