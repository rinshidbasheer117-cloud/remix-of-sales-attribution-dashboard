# Lower panels: ranked visual fixes

Audit only so far. Nothing below is implemented. Pick the ones you want.

## Ranked across all four

1. **Scatter: kill the dead space and fix label collisions.** The y domain is fixed to the max ROAS across all three models (Email hits 14.2x under last touch), so in first touch the top 60% of the plot is empty and every bubble is crushed into a band near the 4x line. Bubble labels overlap neighbouring bubbles and the right edge clips the Search bubble. Highest leverage: this is the panel that most visibly reads as unfinished.

2. **Waterfall: zero-credit bars and the grey collision.** Under last touch, Paid social and Display go to exactly 0% and render as 1px hairlines with a floating "$0" label, which reads as a render bug rather than a finding. Direct's channel grey is also close enough to the Total bar's foreground grey that the two read as the same series. Fixes: an explicit zero-state treatment (ghost outline slot plus a muted "no closing touches" marker) and a distinct total-bar treatment (outline or hatched, not solid foreground).

3. **Waterfall: missing waterfall connectors and awkward ticks.** Floating bars with no connecting steps don't read as a waterfall; the eye can't follow the accumulation. Also the y ticks are quarter-fractions of 2.3M ($575k, $1.15M, $1.73M) rather than round numbers. Add dotted connectors between bar tops and round the tick scale.

4. **Grid layout: the hole under the scatter.** Scatter and Paths share a 2-column row; Paths is much taller, leaving roughly 200px of empty card-less background under the scatter at 1440x900. Either equalise heights or reflow.

5. **Table: the trend column is an afterthought.** Sparklines are jammed against the right edge, each auto-scales to its own min/max (so shapes aren't comparable), and there's no delta figure. Add a shared scale or a percentage-change label, and give the column breathing room.

6. **Paths: the share bar carries no channel identity.** The 64px grey bar is the only non-typographic element in the panel and it's the one thing not using the palette. Multi-step rows also wrap to two lines with ragged heights. Options: colour the share bar by the credited channel under the active model, and fix row heights.

## Data credibility (separate from visuals)

Under last touch, Paid social shows $150,000 spend, $0 revenue, 0.00x ROAS, 0 conversions — because no authored path in `PATHS` ends on Paid social or Display. A finance-literate viewer will read that as a data bug, not a model insight. Fix is in the path mix, not the panel: add a small number of retargeting-style journeys that close on paid social and display.

## Technical notes

- All five panels read `c.color`, which is `var(--ch-*)`; the field resolves the same token via computed style. Colour is keyed by channel id everywhere, and nothing repaints on sort or filter. No action needed.
- The waterfall reshuffle is genuinely dramatic (Social 29% first touch to 0% last touch; Search 13% to 32%). The transition reads well; the problem is only how the endpoints of that range render.
