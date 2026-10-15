import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { getModelData, MODELS, QUARTER, type AttributionModel } from "@/data/attribution";
import { interpolateChannels } from "@/lib/interp";
import { useTransitionSnapshot } from "@/hooks/use-transition-snapshot";
import { useTheme } from "@/hooks/use-theme";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";
import { KpiStrip } from "@/components/dashboard/kpi-strip";
import { ModelToggle } from "@/components/dashboard/model-toggle";
import { WaterfallPanel } from "@/components/dashboard/waterfall-panel";
import { ScatterPanel } from "@/components/dashboard/scatter-panel";
import { PathsPanel } from "@/components/dashboard/paths-panel";
import { ChannelTable } from "@/components/dashboard/channel-table";
import { RevenueRail } from "@/components/dashboard/revenue-rail";
import { TemplateGuide } from "@/components/dashboard/template-guide";


const title = "Sales by channel · Attribution dashboard";
const description =
  "Which channels earn credit for 12,500 conversions and $2.30M in quarterly sales, recomputed across first touch, linear and last touch models.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const [model, setModel] = useState<AttributionModel>("first");
  const { theme, toggle } = useTheme();
  const { from, to, t } = useTransitionSnapshot(model, 860);
  const [stuck, setStuck] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setStuck(!entry.isIntersecting),
      { rootMargin: "-1px 0px 0px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const reduced = useReducedMotion();
  // Same snapshot, remapped per consumer so panels settle in a wave.
  const stage = (d: number) =>
    reduced ? 1 : Math.min(1, Math.max(0, (t - d) / (1 - d)));
  const railChannels = useMemo(() => interpolateChannels(from, to, stage(0)), [from, to, t, reduced]);
  const waterfallChannels = useMemo(() => interpolateChannels(from, to, stage(0.07)), [from, to, t, reduced]);
  const scatterChannels = useMemo(() => interpolateChannels(from, to, stage(0.14)), [from, to, t, reduced]);
  const tableChannels = useMemo(() => interpolateChannels(from, to, stage(0.28)), [from, to, t, reduced]);
  // A staged model flips at its own point in the wave, so highlight-only
  // consumers land last instead of snapping first.
  const stagedModel = (d: number) => (stage(d) >= 0.5 ? to : from);
  const pathsModel = stagedModel(0.21);
  const kpiModel = stagedModel(0.28);
  const settled = to;
  const blurb = MODELS.find((m) => m.id === model)?.blurb;

  return (
    <div className="min-h-screen">
      <main className="pt-5 sm:pt-7">
        <div ref={sentinelRef} aria-hidden className="h-px" />

        <div className="pointer-events-none sticky top-3 z-40 mx-auto flex max-w-7xl flex-col gap-4 px-4 pb-5 sm:px-6 lg:flex-row-reverse lg:items-start lg:justify-between lg:px-8">
          <div className="flex flex-col gap-2 lg:items-end">
            <div
              className={cn(
                "surface-raised pointer-events-auto flex w-full items-center gap-1.5 rounded-2xl p-1 backdrop-blur-md transition-shadow duration-300 sm:w-auto",
                stuck &&
                  "shadow-[0_2px_6px_oklch(0.21_0.034_264/0.08),0_18px_44px_-12px_oklch(0.21_0.034_264/0.22)]",
              )}
            >
              <ModelToggle model={model} onChange={setModel} />
              <div className="h-5 w-px shrink-0 bg-border" aria-hidden />
              <button
                onClick={toggle}
                aria-label="Toggle colour theme"
                className="flex size-8 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
              </button>
            </div>
            <div
              className={cn(
                "flex items-center gap-3 self-start transition-opacity duration-300 lg:self-end",
                stuck && "pointer-events-none opacity-0",
              )}
            >
              <TemplateGuide />
            </div>
            <p
              className={cn(
                "text-xs text-muted-foreground transition-opacity duration-300 sm:text-right",
                stuck && "opacity-0",
              )}
            >
              {blurb}
            </p>
          </div>

          <div
            className={cn(
              "pointer-events-auto max-w-2xl transition-opacity duration-300",
              stuck && "pointer-events-none opacity-0",
            )}
          >
            <p className="text-[0.65rem] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
              Sales by channel · {QUARTER.label}
            </p>
            <h1 className="mt-1 text-2xl font-bold leading-tight tracking-tight text-foreground sm:text-[1.9rem]">
              Which channel gets attribution for the sale?
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              How credit for {QUARTER.totalConversions.toLocaleString("en-US")} conversions moves
              across seven channels, depending on the attribution model you believe.
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 pb-6 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-12 sm:gap-5 lg:gap-6">
            <div className="surface-raised px-5 py-5 sm:col-span-12 sm:px-6 sm:py-6">
              <RevenueRail channels={railChannels} from={from} to={to} t={t} />
            </div>

            <div className="sm:col-span-12 lg:col-span-6">
              <ScatterPanel channels={scatterChannels} />
            </div>
            <div className="sm:col-span-12 lg:col-span-6">
              <WaterfallPanel channels={waterfallChannels} from={from} to={to} t={stage(0.07)} />
            </div>

            <KpiStrip channels={tableChannels} model={kpiModel} />

            <div className="sm:col-span-12">
              <PathsPanel model={pathsModel} />
            </div>

            <div className="sm:col-span-12">
              <ChannelTable channels={tableChannels} />
            </div>
          </div>

          <footer className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5 text-xs text-muted-foreground sm:mt-12">
            <p className="max-w-2xl">
              Data-driven attribution is not included. The three models here are rules-based and
              computed from the same observed journeys. Demo data for a fictional B2B SaaS company.
              Edit{" "}
              <code className="rounded bg-muted px-1.5 py-0.5">src/data/attribution.ts</code> to swap
              in your own numbers.
            </p>
            <p className="tnum">
              {getModelData(settled).length} channels · {QUARTER.label}
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
}
