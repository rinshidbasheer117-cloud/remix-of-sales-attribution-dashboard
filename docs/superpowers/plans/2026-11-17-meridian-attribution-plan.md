# Meridian Attribution Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the repository's active app a responsive, model-switching Meridian attribution dashboard.

**Architecture:** Keep the existing typed path-based attribution engine and SVG panels. Add one dashboard shell and compose the panels in the TanStack index route; remove obsolete bicycle route entries from the active route set.

**Tech Stack:** React 19, TanStack Start/Router, TypeScript, Tailwind CSS, inline SVG, Framer Motion, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-17-meridian-attribution-design.md` and `README.md`.

## Global Constraints

- Seven fixed channel identities: Paid Search, Paid Social, Email, Organic, Display, Referral, Direct.
- Quarter totals remain $2.3M attributed revenue and 12,500 conversions under all three models.
- The model switch transition lasts 720 ms; channel colors never change with rank.
- Static data only; no authentication or backend.
- Do not add a charting dependency or a Sankey diagram.

## Review Focus

- Path shares and largest-remainder conversion allocation conserve the quarter totals.
- All visible panels use the same active model and transition endpoints.
- The constant blended ROAS is labeled accurately; model-specific channel ROAS changes.
- Unpaid channels remain visible in the waterfall and table while being omitted from the paid-spend scatter.
- Keyboard operation, reduced motion, dark theme contrast, and mobile overflow.

## Tasks

## Task 1 — Lock the model invariants with failing tests

Add `src/data/attribution.test.ts` using the existing Vitest setup. Assert each model totals exactly 12,500 conversions and approximately $2.3M revenue, every model includes all seven channels and twelve trend points per channel, and at least one channel's share differs between first/linear/last. Run the test once and confirm the expected failure before changing production code.

## Task 2 — Wire the Meridian dashboard

Replace the CycleWorks index route with a dashboard composition using `ModelToggle`, `KpiStrip`, `WaterfallPanel`, `ScatterPanel`, `PathsPanel`, and `ChannelTable`. Share one 720 ms `useTransitionSnapshot` value across animated panels, derive the selected model's rows from `getModelData`, and show an invariant total in the header.

## Task 3 — Replace the bicycle application shell

Add a compact Meridian header with the model context, theme control, and template guide. Remove bicycle branding, Supabase auth listeners, and obsolete bicycle route modules from the active route tree; let TanStack regenerate `routeTree.gen.ts` during build.

## Task 4 — Finish responsive and accessibility details

Keep the dashboard grid breathable on desktop, stack panels on small screens, preserve horizontal waterfall/table scrolling, support keyboard selection and reduced motion, and keep channel colors consistent in both themes.

## Task 5 — Verify and review

Run the attribution test, lint, production build, and PR preflight. Review the final diff, resolve implementation issues, commit only dashboard and plan files, push once to `feat/meridian-attribution-dashboard`, and open the requested PR against `main`.
