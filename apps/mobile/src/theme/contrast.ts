/** WCAG 2.2 relative luminance and contrast ratio for the palette's #RRGGBB values. */
const hexColor = /^#([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})$/;

function linearChannel(component: string): number {
  const srgb = Number.parseInt(component, 16) / 255;
  return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex: string): number {
  const match = hexColor.exec(hex);
  if (!match) throw new Error(`Expected an opaque #RRGGBB colour, received ${JSON.stringify(hex)}`);
  const [red = 0, green = 0, blue = 0] = match.slice(1).map(linearChannel);
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

/** Ratio from 1 (identical) to 21 (black on white); the argument order does not matter. */
export function contrastRatio(first: string, second: string): number {
  const a = relativeLuminance(first);
  const b = relativeLuminance(second);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}
