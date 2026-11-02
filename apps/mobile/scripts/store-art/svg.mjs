// Deterministic SVG export of a store-art scene: the vector master of the same pixel-space geometry
// the rasterizer draws. Fill layers become paths; trailing erase layers become a luminance mask.

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
const XML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' };

export function formatNumber(value) {
  if (!Number.isFinite(value)) {
    throw new Error(`Cannot write a non-finite coordinate (${value}) to SVG`);
  }
  return String(Number(value.toFixed(2)));
}

export function escapeXml(text) {
  return String(text).replace(/[&<>"']/g, (character) => XML_ESCAPES[character]);
}

export function pathData(rings) {
  return rings
    .map((ring) => `M${ring.map(([x, y]) => `${formatNumber(x)} ${formatNumber(y)}`).join('L')}Z`)
    .join('');
}

function splitLayers(layers) {
  const firstErase = layers.findIndex((layer) => layer.kind === 'erase');
  const fills = firstErase === -1 ? layers : layers.slice(0, firstErase);
  const erases = firstErase === -1 ? [] : layers.slice(firstErase);
  for (const layer of fills) {
    if (layer.kind !== 'fill') {
      throw new Error(`Unknown layer kind ${String(layer.kind)}`);
    }
  }
  if (erases.some((layer) => layer.kind !== 'erase')) {
    throw new Error('SVG export supports erase layers only after every fill layer');
  }
  return { fills, erases };
}

/** Render a scene ({ width, height, title, background, layers }) to an SVG document string. */
export function renderSvg({ width, height, title, background = null, layers }) {
  const { fills, erases } = splitLayers(layers);
  const paths = fills
    .filter((layer) => layer.rings.length > 0)
    .map((layer) => `<path fill="${layer.color}" d="${pathData(layer.rings)}"/>`);
  const knockout =
    erases.length === 0
      ? paths
      : [
          `<mask id="knockout" maskUnits="userSpaceOnUse" x="0" y="0" width="${width}" height="${height}">`,
          `<rect width="${width}" height="${height}" fill="#FFFFFF"/>`,
          `<path fill="#000000" d="${pathData(erases.flatMap((layer) => layer.rings))}"/>`,
          '</mask>',
          '<g mask="url(#knockout)">',
          ...paths,
          '</g>',
        ];
  const lines = [
    `<svg xmlns="${SVG_NAMESPACE}" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    `<title>${escapeXml(title)}</title>`,
    ...(background === null ? [] : [`<rect width="${width}" height="${height}" fill="${background}"/>`]),
    ...knockout,
    '</svg>',
  ];
  return `${lines.join('\n')}\n`;
}
