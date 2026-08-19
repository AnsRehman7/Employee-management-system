/**
 * Shared line-chart geometry.
 *
 * Charts use a real-aspect viewBox and the default `preserveAspectRatio`. Stretching a
 * square viewBox with `preserveAspectRatio="none"` distorts stroke width and turns
 * round markers into ovals, which is what made the earlier charts look wrong.
 */

export const CHART_WIDTH = 760;
export const CHART_HEIGHT = 260;
export const CHART_PADDING = { bottom: 24, left: 14, right: 14, top: 18 };

export const plotArea = {
  height: CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom,
  width: CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right,
};

/** Maps values onto chart coordinates, oldest point on the left. */
export const toCoordinates = (values, maxValue) =>
  values.map((value, index) => ({
    x:
      values.length === 1
        ? CHART_PADDING.left + plotArea.width / 2
        : CHART_PADDING.left + (index / (values.length - 1)) * plotArea.width,
    y: CHART_PADDING.top + plotArea.height - (value / Math.max(maxValue, 1)) * plotArea.height,
  }));

/**
 * Catmull-Rom to cubic Bezier, so a series reads as a trend instead of a run of hard
 * corners. Control points are derived from the neighbours of each segment.
 */
export const smoothPath = (coordinates) => {
  if (!coordinates.length) return "";
  if (coordinates.length === 1) return `M ${coordinates[0].x} ${coordinates[0].y}`;

  return coordinates.reduce((path, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`;

    const previous = coordinates[index - 1];
    const beforePrevious = coordinates[index - 2] || previous;
    const next = coordinates[index + 1] || point;

    const controlOneX = previous.x + (point.x - beforePrevious.x) / 6;
    const controlOneY = previous.y + (point.y - beforePrevious.y) / 6;
    const controlTwoX = point.x - (next.x - previous.x) / 6;
    const controlTwoY = point.y - (next.y - previous.y) / 6;

    return `${path} C ${controlOneX} ${controlOneY}, ${controlTwoX} ${controlTwoY}, ${point.x} ${point.y}`;
  }, "");
};

/** Closes a line path down to the baseline so it can be filled. */
export const areaPath = (linePath, coordinates) => {
  if (!linePath || coordinates.length === 0) return "";
  const baseline = CHART_PADDING.top + plotArea.height;
  return `${linePath} L ${coordinates[coordinates.length - 1].x} ${baseline} L ${coordinates[0].x} ${baseline} Z`;
};

/** Evenly spaced horizontal reference lines. */
export const gridLines = [0, 0.25, 0.5, 0.75, 1].map((step) => ({
  key: step,
  y: CHART_PADDING.top + plotArea.height * step,
}));
