import { createFileRoute } from "@tanstack/react-router";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { useMemo, useState } from "react";
import {
  CHANNELS,
  MODELS,
  QUARTER,
  TOTAL_SPEND,
  getModelData,
  type AttributionModel,
} from "@/data/attribution";
import { ChannelTable } from "@/components/dashboard/channel-table";
import { KpiStrip } from "@/components/dashboard/kpi-strip";
import { ModelToggle } from "@/components/dashboard/model-toggle";
import { PathsPanel } from "@/components/dashboard/paths-panel";
import { ScatterPanel } from "@/components/dashboard/scatter-panel";
import { TemplateGuide } from "@/components/dashboard/template-guide";
import { WaterfallPanel } from "@/components/dashboard/waterfall-panel";
import { ThemeToggle } from "@/components/theme-toggle";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useTransitionSnapshot } from "@/hooks/use-transition-snapshot";
import { currency, number } from "@/lib/format";
import { interpolateModelData } from "@/data/transition";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Meridian Attribution · Marketing analytics" },
      {
        name: "description",
        content:
          "Explore how first-touch, linear, and last-touch attribution change the story behind marketing revenue.",
      },
    ],
    links: [{ rel: "preconnect", href: "https://fonts.googleapis.com" }],
  }),
  component: AttributionDashboard,
});

function AttributionDashboard() {
  const [model, setModel] = useState<AttributionModel>("first");
  const reducedMotion = useReducedMotion();
  const snapshot = useTransitionSnapshot(model, reducedMotion ? 1 : 720);
  const channels = useMemo(
    () => interpolateModelData(getModelData(snapshot.from), getModelData(snapshot.to), snapshot.t),
    [snapshot.from, snapshot.to, snapshot.t],
  );

  const activeModel = MODELS.find((item) => item.id === model)!;
  const totalMix = channels.reduce((sum, channel) => sum + channel.revenue, 0);

  return (
    <main className="meridian-page min-h-screen bg-background text-foreground">
      <header className="meridian-header border-b border-border/80">
        <div className="mx-auto flex max-w-[1540px] items-center justify-between gap-4 px-4 py-4 sm:px-7 lg:px-10">
          <a
            href="#top"
            className="flex min-w-0 items-center gap-3"
            aria-label="Meridian Attribution home"
          >
            <span className="meridian-mark" aria-hidden>
              m
            </span>
            <span>
              <span className="block text-sm font-bold tracking-tight">Meridian</span>
              <span className="hidden text-[0.65rem] text-muted-foreground sm:block">
                ATTRIBUTION INTELLIGENCE
              </span>
            </span>
          </a>
          <div className="flex shrink-0 items-center gap-2 sm:gap-4">
            <span className="hidden text-xs text-muted-foreground sm:block">{QUARTER.label}</span>
            <ThemeToggle />
            <TemplateGuide />
          </div>
        </div>
      </header>

      <div id="top" className="mx-auto max-w-[1540px] px-4 pb-12 pt-8 sm:px-7 sm:pt-10 lg:px-10">
        <section className="mb-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
          <div className="max-w-3xl">
            <p className="meridian-eyebrow">
              MARKETING PERFORMANCE · {QUARTER.label.toUpperCase()}
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
              The revenue story changes with the model.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              See how each channel earns credit across the customer journey. Every view updates
              together while the quarter total stays fixed.
            </p>
          </div>
          <div className="w-full xl:w-auto">
            <p className="mb-2 text-[0.65rem] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
              Attribution model
            </p>
            <ModelToggle model={model} onChange={setModel} />
            <p className="mt-2 text-xs text-muted-foreground">{activeModel.blurb}</p>
          </div>
        </section>

        <section aria-label="Quarter summary" className="mb-5 grid grid-cols-12 gap-3">
          <KpiStrip channels={channels} model={model} />
        </section>

        <section aria-label="Revenue attribution" className="mb-5">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-3 px-1">
            <div>
              <p className="meridian-eyebrow">CREDIT DISTRIBUTION</p>
              <h2 className="mt-1 text-lg font-semibold tracking-tight">Channel contribution</h2>
            </div>
            <p className="text-xs text-muted-foreground">
              {currency(totalMix)} attributed · {number(QUARTER.totalConversions)} conversions
            </p>
          </div>
          <WaterfallPanel
            channels={channels}
            from={snapshot.from}
            to={snapshot.to}
            t={snapshot.t}
          />
        </section>

        <section
          aria-label="Channel returns and customer journeys"
          className="mb-5 grid min-w-0 grid-cols-1 items-stretch gap-5 xl:grid-cols-[1.02fr_0.98fr]"
        >
          <ScatterPanel channels={channels} />
          <PathsPanel model={model} from={snapshot.from} to={snapshot.to} t={snapshot.t} />
        </section>

        <section aria-label="Channel detail">
          <ChannelTable channels={channels} />
        </section>

        <footer className="mt-6 flex flex-col gap-2 border-t border-border/70 pt-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>Illustrative attribution data for a fictional B2B SaaS quarter.</span>
          <span className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <ArrowDownRight className="size-3.5" /> {CHANNELS.length} channels
            </span>
            <span className="flex items-center gap-1">
              <ArrowUpRight className="size-3.5" /> {currency(TOTAL_SPEND)} spend
            </span>
            <span className="sr-only">Current model: {activeModel.label}</span>
          </span>
        </footer>
      </div>
      <div className="sr-only" aria-live="polite">
        Attribution model changed to {activeModel.label}
      </div>
    </main>
  );
}
