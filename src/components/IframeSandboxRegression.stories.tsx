import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type React from "react";

import ContentRender from "./ContentRender";
import Slide from "./Slide";
import type { Element } from "./Slide";

const meta = {
  title: "MarkdownFlow/IframeSandboxRegression",
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Regression coverage for one iframe sandbox element rendered in both reading-mode ContentRender and listen-mode Slide surfaces.",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

const SANDBOX_ELEMENT_CONTENT = `
<div style="width:100%; height:100vh; overflow-x:hidden; overflow-y:auto; display:flex; flex-direction:column; align-items:center; justify-content:safe center; padding:3.5em; font-size:clamp(12px,calc(100vw/48),3vh); position:relative; background:linear-gradient(135deg, #0F63EE 0%, #1a4fa0 50%, #0b3d8a 100%); color:white; text-align:center;">
  <!-- 装饰光晕 -->
  <div style="position:absolute; top:0; right:0; width:60%; height:60%; background:radial-gradient(circle at 80% 20%, rgba(255,255,255,0.12) 0%, transparent 70%); pointer-events:none; z-index:0;"></div>
  <div style="position:absolute; bottom:0; left:0; width:50%; height:50%; background:radial-gradient(circle at 20% 80%, rgba(255,255,255,0.08) 0%, transparent 60%); pointer-events:none; z-index:0;"></div>

  <!-- 教师形象照 -->
  <div style="position:relative; z-index:1; width:8em; height:8em; border-radius:50%; border:3px solid rgba(255,255,255,0.6); overflow:hidden; margin-bottom:1.5em; box-shadow:0 0.5em 2em rgba(0,0,0,0.3);">
    <img src="https://resource.ai-shifu.com/ac186b833d0e417fb02737910b3a5ae0" alt="孙志岗" style="width:100%; height:100%; object-fit:cover;" />
  </div>

  <!-- 课程名称 -->
  <div style="position:relative; z-index:1; font-size:3.5em; font-weight:700; letter-spacing:0.05em; text-shadow:0 2px 10px rgba(0,0,0,0.3); margin-bottom:0.3em;">
    <span style="display:inline-block; background:rgba(255,255,255,0.15); padding:0.1em 0.5em; border-radius:0.2em;">跟 AI 学 AI 通识</span>
  </div>

  <!-- 讲师姓名 -->
  <div style="position:relative; z-index:1; font-size:2em; font-weight:600; margin-bottom:0.8em; opacity:0.9;">
    孙志岗
  </div>

  <!-- 分隔线 -->
  <div style="position:relative; z-index:1; width:4em; height:2px; background:rgba(255,255,255,0.5); margin-bottom:0.8em;"></div>

  <!-- 个人目标 -->
  <div style="position:relative; z-index:1; font-size:1.5em; font-weight:500; max-width:80%; line-height:1.5; background:rgba(255,255,255,0.1); padding:0.5em 1.2em; border-radius:0.5em; backdrop-filter:blur(4px);">
    🎯 帮助 100 万人顺利走进 AGI 时代
  </div>

  <!-- 专属讲课 -->
  <div style="position:relative; z-index:1; margin-top:1.2em; font-size:1em; opacity:0.8; display:flex; align-items:center; gap:0.5em;">
    <span>🎓</span>
    <span>为你一个人，专门开讲</span>
  </div>
</div>
<style>
*,*::before,*::after{box-sizing:border-box;overflow-wrap:break-word;word-wrap:break-word}
</style>
`;

const REGRESSION_ELEMENT: Element = {
  sequence_number: 1,
  type: "html",
  content: SANDBOX_ELEMENT_CONTENT,
  is_renderable: true,
  is_marker: true,
  is_new: true,
  is_speakable: false,
  audio_url: "",
  audio_segments: [],
};

const PreviewPanel = ({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) => (
  <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-background shadow-sm">
    <div className="border-b border-border bg-muted/30 px-4 py-3">
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
    <div className="min-h-0 flex-1">{children}</div>
  </section>
);

export const OneElementReadingAndListenMode: Story = {
  name: "One Element Reading And Listen Mode",
  render: () => (
    <main className="flex h-[100dvh] min-h-0 flex-col gap-4 bg-muted/20 p-4">
      <div className="shrink-0 rounded-lg border border-border bg-background px-4 py-3 shadow-sm">
        <h1 className="text-lg font-semibold text-foreground">
          Iframe sandbox single element regression
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          The same html element is rendered as reading-mode content and as a
          listen-mode slide.
        </p>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-2 gap-4">
        <PreviewPanel
          title="Reading mode"
          description="ContentRender receives the element content directly, matching the read-mode content surface."
        >
          <div className="h-full overflow-auto bg-slate-50 p-5">
            <div className="mx-auto max-w-4xl rounded-lg bg-white p-5 shadow-sm ring-1 ring-border">
              <ContentRender
                content={REGRESSION_ELEMENT.content as string}
                enableTypewriter={false}
                sandboxFullscreenButtonText="Fullscreen"
                sandboxLoadingText="Building preview..."
                sandboxMode="content"
              />
            </div>
          </div>
        </PreviewPanel>
        <PreviewPanel
          title="Listen mode"
          description="Slide receives the same element as a one-item elementList, matching the listen-mode slide surface."
        >
          <div className="relative flex h-full min-h-0 w-full flex-col overflow-hidden bg-[var(--color-slide-desktop-bg)]">
            <Slide
              className="h-full w-full listen-slide-root"
              elementList={[REGRESSION_ELEMENT]}
              playerAlwaysVisible
              playerTexts={{
                settingsTitle: "Settings",
                screenLabel: "Screen",
                nonFullscreenLabel: "Non-fullscreen",
                fullscreenLabel: "Fullscreen",
                fullscreenHintText:
                  "Rotate your screen for the best experience.",
              }}
            />
          </div>
        </PreviewPanel>
      </div>
    </main>
  ),
};
