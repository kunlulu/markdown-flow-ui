import { applyPatch, parsePatch } from "diff";
import { parseBlackboardStream } from "./diff-parser";

interface ParsedUnifiedDiff {
  targetIndex: number;
  patchText: string;
}

const DIFF_TARGET_PATTERN = /^---\s+a\/(\d+)/;
const DIFF_NEW_TARGET_PATTERN = /^\+\+\+\s+b\/(\d+)/;

export class BlackboardRuntime {
  private readonly host: HTMLElement;
  private readonly doc: Document;
  private readonly stage: HTMLDivElement;
  private renderedHtmlCount = 0;
  private renderedDiffCount = 0;

  constructor(host: HTMLElement) {
    this.host = host;
    this.doc = host.ownerDocument;
    this.stage = this.ensureStageContainer();
  }

  private ensureStageContainer() {
    let stage = this.host.querySelector<HTMLDivElement>("#ppt-container");
    if (!stage) {
      stage = this.doc.createElement("div");
      stage.id = "ppt-container";
      stage.style.width = "100%";
      stage.style.minHeight = "100dvh";
      stage.style.position = "relative";
      this.host.appendChild(stage);
    }
    return stage;
  }

  reset() {
    this.renderedHtmlCount = 0;
    this.renderedDiffCount = 0;
    this.stage.innerHTML = "";
  }

  hasRenderedContent() {
    return this.stage.childElementCount > 0;
  }

  update(source: string) {
    const parsed = parseBlackboardStream(source);

    if (parsed.hasUnclosedDiffBlock) {
      return;
    }

    const htmlShrink =
      parsed.htmlBlocks.length < this.renderedHtmlCount &&
      !parsed.isPureDiffPayload;
    const diffShrink = parsed.diffBlocks.length < this.renderedDiffCount;
    const hasShrink = htmlShrink || diffShrink;

    if (hasShrink) {
      this.reset();
    }

    for (
      let index = this.renderedHtmlCount;
      index < parsed.htmlBlocks.length;
      index += 1
    ) {
      this.appendHtml(parsed.htmlBlocks[index]);
    }

    this.renderedHtmlCount = parsed.htmlBlocks.length;

    for (
      let index = this.renderedDiffCount;
      index < parsed.diffBlocks.length;
      index += 1
    ) {
      this.applyDiff(parsed.diffBlocks[index]);
    }

    this.renderedDiffCount = parsed.diffBlocks.length;
  }

  private appendHtml(html: string) {
    const parser = new DOMParser();
    const parsedDoc = parser.parseFromString(html, "text/html");
    const nodes = Array.from(parsedDoc.body.childNodes);

    nodes.forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement;

        if (element.tagName === "SCRIPT") {
          const script = this.doc.createElement("script");
          script.textContent = element.textContent;
          Array.from(element.attributes).forEach((attr) => {
            script.setAttribute(attr.name, attr.value);
          });
          this.stage.appendChild(script);
          return;
        }

        if (element.tagName === "STYLE") {
          const style = this.doc.createElement("style");
          style.textContent = element.textContent;
          Array.from(element.attributes).forEach((attr) => {
            style.setAttribute(attr.name, attr.value);
          });
          this.stage.appendChild(style);
          return;
        }

        if (this.stage.children.length > 0) {
          this.stage.innerHTML = "";
        }

        this.stage.appendChild(this.doc.importNode(element, true));
        return;
      }

      if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
        if (this.stage.children.length > 0) {
          this.stage.innerHTML = "";
        }
        const textDiv = this.doc.createElement("div");
        textDiv.textContent = node.textContent;
        this.stage.appendChild(textDiv);
      }
    });
  }

  private parseUnifiedDiff(diffContent: string): ParsedUnifiedDiff {
    const lines = diffContent.split("\n");
    const currentMatch = lines[0]?.match(DIFF_TARGET_PATTERN);
    if (!currentMatch) {
      throw new Error('Invalid diff format: missing "--- a/index"');
    }

    const targetIndex = Number.parseInt(currentMatch[1], 10);
    const newMatch = lines[1]?.match(DIFF_NEW_TARGET_PATTERN);
    if (!newMatch || Number.parseInt(newMatch[1], 10) !== targetIndex) {
      throw new Error("Invalid diff format: mismatched target index");
    }

    return { targetIndex, patchText: diffContent };
  }

  private normalizeHTML(html: string) {
    return html
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .join("\n");
  }

  private normalizePatch<T extends { hunks?: Array<{ lines?: string[] }> }>(
    patch: T
  ): T {
    const clonedPatch = JSON.parse(JSON.stringify(patch)) as T;
    clonedPatch.hunks?.forEach((hunk) => {
      if (!hunk.lines) {
        return;
      }

      hunk.lines = hunk.lines.map((line) => {
        if (!line) {
          return line;
        }

        const marker = line[0];
        if (marker === " " || marker === "+" || marker === "-") {
          const normalized = line.slice(1).trim();
          return normalized ? `${marker}${normalized}` : marker;
        }

        return line;
      });
    });
    return clonedPatch;
  }

  private rehydrateScripts(element: Element) {
    element.querySelectorAll("script").forEach((oldScript) => {
      const newScript = this.doc.createElement("script");
      newScript.textContent = oldScript.textContent;
      Array.from(oldScript.attributes).forEach((attr) => {
        newScript.setAttribute(attr.name, attr.value);
      });
      oldScript.replaceWith(newScript);
    });
  }

  private applyDiff(diffContent: string) {
    try {
      const { targetIndex, patchText } = this.parseUnifiedDiff(diffContent);
      const children = Array.from(this.stage.children);

      if (targetIndex < 0 || targetIndex >= children.length) {
        console.warn(
          `[BlackboardRuntime] Diff target index ${targetIndex} out of range (0-${children.length - 1})`
        );
        return;
      }

      const target = children[targetIndex] as HTMLElement;
      const currentHTML = target.outerHTML;
      const patches = parsePatch(patchText);

      if (!patches.length) {
        console.warn("[BlackboardRuntime] No valid patches found in diff");
        return;
      }

      const firstPatch = patches[0];
      let result = applyPatch(currentHTML, firstPatch);

      if (result === false) {
        const normalizedHTML = this.normalizeHTML(currentHTML);
        const normalizedPatch = this.normalizePatch(firstPatch);
        result = applyPatch(normalizedHTML, normalizedPatch);
      }

      if (result === false) {
        console.warn("[BlackboardRuntime] Failed to apply diff patch");
        return;
      }

      const temp = this.doc.createElement("div");
      temp.innerHTML = result;
      const nextElement = temp.firstElementChild;
      if (!nextElement) {
        return;
      }

      this.rehydrateScripts(nextElement);
      target.replaceWith(nextElement);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown error while applying diff";
      console.warn("[BlackboardRuntime] Diff apply error:", message);
    }
  }
}
