export function nearestIndex(sorted: number[], target: number): number {
  if (sorted.length === 0) return -1

  let low = 0
  let high = sorted.length - 1
  while (low < high) {
    const mid = (low + high) >> 1
    if (sorted[mid] < target) low = mid + 1
    else high = mid
  }

  const previous = low - 1
  if (previous < 0) return low
  return target - sorted[previous] <= sorted[low] - target ? previous : low
}
