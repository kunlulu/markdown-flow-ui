---
name: iframe-sandbox-regression-story
description: 为 `markdown-flow-ui` 新增或维护根层级 iframe sandbox 回归 story 时使用本技能，尤其适用于同时覆盖 `ContentRender` 阅读模式与 `Slide` 听课模式链路的场景。
---

# IframeSandbox 回归 Story

## 核心规则

当需要验证 `IframeSandbox` 的组件级回归时，优先用同一个 `element` 同时展示 `ContentRender` 阅读模式样式和 `Slide` 听课模式样式，避免多个分散 story 让对比成本变高。

## 工作流

1. 在 `src/**/*.stories.tsx` 中使用根层级标题，例如 `MarkdownFlow/IframeSandboxRegression`，让 Storybook 左侧和组件 story 同级展示。
2. 默认只导出一个 story example，让 Storybook 节点下只有一个用例；除非用户明确要求拆分多个 case。
3. 将 sandbox HTML 抽成独立常量，再基于该内容构造单个 `Element` 常量，避免阅读模式和听课模式各写一份 fixture。
4. 阅读模式区域用 `ContentRender` 直接接收同一个 element 的 `content`，用于观察 read-mode content surface。
5. 听课模式区域用 `Slide` 接收 `[element]` 作为单元素 `elementList`；iframe 页面使用 `type: "html"`。
6. 听课模式预览应让 `Slide` 直接占满面板内容区，并使用类似 ai-shifu 的 `h-full w-full listen-slide-root` 尺寸，不要再套 `items-center justify-center` 这类会把 slide 变成小预览的居中容器。
7. 示例内容中可包含 `<style>` 与 `<script>`，用于确认 iframe 内样式注入和脚本执行；代码注释保持英文。

## 约束

- 不要删除已有 `console.log`，story 内需要观测点击时可以新增简短日志。
- story 布局优先使用 Tailwind className；涉及高度时使用 `dvh` 或普通百分比高度，不使用 `vh`。
- sandbox 内容里的 Tailwind 高度也优先使用 `100dvh`，避免 `h-screen` 这类 `vh` 快捷类。
- 新增 story 名称使用英文，fixture 常量命名保持清晰可复用。
- 当用户要求“一个 element 同时看阅读模式和听课模式”时，不要再保留 direct iframe、blackboard 等额外用例；应把它们收敛进单个左右对照预览。
