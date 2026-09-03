export const ESTIMATED_CHAR_WIDTH = 6.5

export const LABEL_GAP = 8

export function estimateLabelWidth(label: string): number {
  return label.length * ESTIMATED_CHAR_WIDTH
}
