// Also exported, for Gabarit's own entry points only (not public API): `estimateLabelWidth`, `timeXDomain`.
export { ChartAxis } from './chart-axis/chart-axis'
export {
  CHART_CONTEXT,
  type AxisSpec,
  type ChartBox,
  type ChartMargin,
  type ChartReader,
  type LinearAxisSpec,
  type PointValue,
} from './chart-context/chart-context'
export {
  niceXDomain,
  niceYDomain,
  timeXDomain,
  type ChartInterval,
  type ChartPoint,
  type ChartSeries,
} from './chart-data/chart-data'
export { ChartEmpty } from './chart-empty/chart-empty'
export { ChartFrame } from './chart-frame/chart-frame'
export { ChartLegend, type LegendEntry } from './chart-legend/chart-legend'
export { ChartTable } from './chart-table/chart-table'
export { ChartTooltip, type TooltipPoint, type TooltipRow } from './chart-tooltip/chart-tooltip'
export { estimateLabelWidth } from './primitives/label'
export { nearestIndex } from './primitives/nearest'
export { arcPath, areaPath, linePath, type Arc, type Point } from './primitives/path'
export { bandScale, linearScale, timeScale, type BandScale, type Scale } from './primitives/scales'
export { niceTicks, timeTicks, type TimeTicks, type TimeUnit } from './primitives/ticks'
