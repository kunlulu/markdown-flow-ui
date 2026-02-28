interface ExtractedDiffBlock {
  content: string;
  fullMatch: string;
}

export interface BlackboardParseResult {
  htmlBlocks: string[];
  diffBlocks: string[];
  pendingHTML: string;
  hasUnclosedDiffBlock: boolean;
  isPureDiffPayload: boolean;
}

const TARGET_TAGS = [
  "div",
  "style",
  "script",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "p",
  "svg",
  "section",
  "article",
  "figure",
  "figcaption",
  "aside",
  "header",
  "footer",
  "nav",
  "main",
  "ul",
  "ol",
  "li",
  "table",
  "thead",
  "tbody",
  "tfoot",
  "tr",
  "th",
  "td",
  "caption",
  "canvas",
  "form",
  "fieldset",
  "blockquote",
  "pre",
];

const DIFF_BLOCK_PATTERN = /!\+\+\+\s*([\s\S]+?)\s*!\+\+\+/g;
const DIFF_MARKER_PATTERN = /!\+\+\+/g;
const PURE_DIFF_BLOCK_PATTERN = /!\+\+\+[\s\S]*?!\+\+\+/g;

const extractDiffBlocks = (content: string): ExtractedDiffBlock[] => {
  const blocks: ExtractedDiffBlock[] = [];
  let match: RegExpExecArray | null;
  DIFF_BLOCK_PATTERN.lastIndex = 0;

  while ((match = DIFF_BLOCK_PATTERN.exec(content)) !== null) {
    blocks.push({
      content: match[1],
      fullMatch: match[0],
    });
  }

  return blocks;
};

const findMatchingCloseTag = (
  content: string,
  startPos: number,
  tagName: string
) => {
  const openTag = `<${tagName}`;
  const closeTag = `</${tagName}>`;
  const openTagEnd = content.indexOf(">", startPos);

  if (openTagEnd === -1) {
    return -1;
  }

  let depth = 1;
  let searchPos = openTagEnd + 1;

  while (searchPos < content.length && depth > 0) {
    const nextOpen = content.indexOf(openTag, searchPos);
    const nextClose = content.indexOf(closeTag, searchPos);

    if (nextClose === -1) {
      return -1;
    }

    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth += 1;
      const openEnd = content.indexOf(">", nextOpen);
      searchPos = openEnd === -1 ? nextOpen + openTag.length : openEnd + 1;
      continue;
    }

    depth -= 1;
    if (depth === 0) {
      return nextClose + closeTag.length;
    }
    searchPos = nextClose + closeTag.length;
  }

  return -1;
};

const extractAllCompleteBlocks = (content: string) => {
  const blocks: string[] = [];
  const unmatchedOpens: Array<{ tagName: string; pos: number }> = [];
  let pendingStart = -1;
  let cursor = 0;

  while (cursor < content.length) {
    let nextTagPos = -1;
    let nextTagName: string | null = null;
    let nextIsOpen = false;

    TARGET_TAGS.forEach((tagName) => {
      const openTag = `<${tagName}`;
      const closeTag = `</${tagName}>`;
      const openPos = content.indexOf(openTag, cursor);
      const closePos = content.indexOf(closeTag, cursor);

      if (openPos !== -1 && (nextTagPos === -1 || openPos < nextTagPos)) {
        nextTagPos = openPos;
        nextTagName = tagName;
        nextIsOpen = true;
      }

      if (closePos !== -1 && (nextTagPos === -1 || closePos < nextTagPos)) {
        nextTagPos = closePos;
        nextTagName = tagName;
        nextIsOpen = false;
      }
    });

    if (nextTagPos === -1 || !nextTagName) {
      break;
    }

    if (nextIsOpen) {
      if (unmatchedOpens.length === 0) {
        const blockEnd = findMatchingCloseTag(content, nextTagPos, nextTagName);
        if (blockEnd !== -1) {
          blocks.push(content.substring(nextTagPos, blockEnd));
          cursor = blockEnd;
          continue;
        }
        if (pendingStart === -1) {
          pendingStart = nextTagPos;
        }
      }

      unmatchedOpens.push({ tagName: nextTagName, pos: nextTagPos });
      const tagEnd = content.indexOf(">", nextTagPos);
      cursor = tagEnd !== -1 ? tagEnd + 1 : nextTagPos + nextTagName.length + 1;
      continue;
    }

    const top = unmatchedOpens[unmatchedOpens.length - 1];
    if (top && top.tagName === nextTagName) {
      unmatchedOpens.pop();
    }
    cursor = nextTagPos + nextTagName.length + 3;
  }

  const pendingHTML =
    pendingStart === -1 ? "" : content.substring(pendingStart);
  return { blocks, pendingHTML };
};

export const parseBlackboardStream = (
  source: string
): BlackboardParseResult => {
  if (!source) {
    return {
      htmlBlocks: [],
      diffBlocks: [],
      pendingHTML: "",
      hasUnclosedDiffBlock: false,
      isPureDiffPayload: false,
    };
  }

  const normalizedSource = source.trim();
  const pureDiffBlocks = normalizedSource.match(PURE_DIFF_BLOCK_PATTERN);
  const isPureDiffPayload =
    !!pureDiffBlocks?.length &&
    normalizedSource.replace(PURE_DIFF_BLOCK_PATTERN, "").trim().length === 0;

  const diffBlocks = extractDiffBlocks(source);
  let processedContent = source;

  diffBlocks.forEach((diffBlock, index) => {
    processedContent = processedContent.replace(
      diffBlock.fullMatch,
      `__EXTRACTED_DIFF_${index}__`
    );
  });

  const markerCount = (processedContent.match(DIFF_MARKER_PATTERN) || [])
    .length;
  if (markerCount % 2 !== 0) {
    return {
      htmlBlocks: [],
      diffBlocks: [],
      pendingHTML: "",
      hasUnclosedDiffBlock: true,
      isPureDiffPayload,
    };
  }

  const { blocks, pendingHTML } = extractAllCompleteBlocks(processedContent);

  return {
    htmlBlocks: blocks,
    diffBlocks: diffBlocks.map((block) => block.content),
    pendingHTML,
    hasUnclosedDiffBlock: false,
    isPureDiffPayload,
  };
};
