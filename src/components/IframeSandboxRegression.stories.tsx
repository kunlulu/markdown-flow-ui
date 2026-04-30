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

const SANDBOX_ELEMENT_CONTENT = `<div id="sandbox-regression-root" class="min-h-[100dvh] w-full bg-slate-50 p-[4vmin] text-slate-900">
  <div class="mx-auto flex min-h-[calc(100dvh-8vmin)] max-w-5xl flex-col justify-center gap-[3vmin]">
    <div class="rounded-[2vmin] bg-white p-[4vmin] shadow-lg ring-1 ring-slate-200">
      <p class="text-[2.2vmin] font-semibold uppercase text-sky-700">Iframe sandbox regression</p>
      <h1 class="mt-[1vmin] text-[5vmin] font-bold leading-tight">One element, two rendering surfaces</h1>
      <p class="mt-[2vmin] text-[2.5vmin] leading-relaxed text-slate-600">
        This iframe checks that HTML, Tailwind classes, injected styles, and scripts stay stable in reading and listen modes.
      </p>
      <div class="mt-[3vmin] grid grid-cols-1 gap-[2vmin] md:grid-cols-3">
        <div class="rounded-[1.5vmin] bg-sky-50 p-[2.5vmin] text-sky-900">ContentRender</div>
        <div class="rounded-[1.5vmin] bg-emerald-50 p-[2.5vmin] text-emerald-900">Slide</div>
        <div id="sandbox-regression-script-status" class="rounded-[1.5vmin] bg-amber-50 p-[2.5vmin] text-amber-900">Waiting for script</div>
      </div>
    </div>
  </div>
</div>
<style>
  #sandbox-regression-root[data-script-ready="true"] #sandbox-regression-script-status {
    font-weight: 700;
  }
</style>
<script>
  const root = document.getElementById("sandbox-regression-root");
  const status = document.getElementById("sandbox-regression-script-status");
  if (root && status) {
    root.dataset.scriptReady = "true";
    status.textContent = "Script ready";
  }
</script>`;

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
