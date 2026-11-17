# Meridian Attribution Dashboard — Design

## Intent

Turn the repository's active CycleWorks bicycle app into the Meridian Attribution showcase described in `README.md`. The page should let an enterprise buyer see how channel credit shifts across first-touch, linear, and last-touch attribution while keeping the quarter's underlying revenue and conversion totals fixed.

## Goals

- Make the dashboard the app's only active product surface, with seven channels and the supplied Q2 2026 demo data.
- Put the model selector above four stable KPIs, then give the channel waterfall the most visual space, followed by spend/return, conversion paths, and the sortable detail table.
- Recompute all model-specific values from the shared typed attribution module. Keep the same $2.3M total revenue and 12,500 conversions in every model.
- Animate the model change over 720 ms, preserve channel colors across reordering, and support light/dark themes and narrow screens.
- Keep the app static and public; do not add auth, a database, or live platform integrations.

## Non-goals

- No Sankey diagram, backend, live attribution feed, user accounts, or new attribution model.
- No edits to the unrelated open security PR.
- No new charting dependency: the repository already contains focused SVG chart panels.

## Approach

Use a single TanStack route composed from the existing `src/components/dashboard` panels and `src/data/attribution.ts`. A small dashboard shell owns the Meridian identity, theme toggle, and template guide. The route owns the selected model and a single transition snapshot shared by the waterfall and scatter; the table sorts the selected model's rows and animates their layout. SVG remains the charting layer because the existing panels already encode channel identity directly and can interpolate geometry without adding a dependency.

The model data is the source of truth for KPIs, charts, paths, and the table. The model switch changes channel allocations only; total revenue, total conversions, and total spend remain invariant. All motion is limited to opacity/transform/chart geometry, with the existing reduced-motion handling retained.

## Constraints and review focus

- Use the repository's TanStack file routes; `src/routeTree.gen.ts` remains generated.
- Reuse the seven existing CSS channel tokens and the 12-week trends.
- Keep the waterfall horizontally scrollable on mobile; stack the other panels.
- Verify revenue and conversion conservation, model-sensitive allocations, accessible model controls, and the production build.
- The root `AGENTS.md` and `roadmap.md` describe a different bicycle product; the README's explicit Meridian scope is the task specification for this branch.
