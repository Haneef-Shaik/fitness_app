/**
 * The chart kit (**H6.1**).
 *
 * Built once here because G7's nutrition trends and G9's dashboard consume the
 * same primitives — a chart built inside G-02 is a chart built twice.
 *
 * Every rule that makes these safe lives in `series.ts` (fixed order, the
 * unassignable spacer, the six-series ceiling) and `delta.ts` (a regression is
 * never red). The components apply them; they do not re-decide them.
 */
export * from './series';
export * from './delta';
export { ChartLegend, type LegendSeries } from './ChartLegend';
export { Column, type ColumnPoint } from './Column';
export { HorizontalBar, type BarRow } from './HorizontalBar';
export { Heatmap, type HeatmapRow } from './Heatmap';
export { DotStrip, type Dot, type DotState } from './DotStrip';
export { Line, type LinePoint } from './Line';
export { lineDomain, type Domain } from './lineDomain';
export { StatTile } from './StatTile';
export { Meter } from './Meter';
