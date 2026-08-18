/*
 * Growth charts drawn with the colour bands of the Sri Lanka CHDR
 * (Child Health Development Record) chart, so the screen reads the same way as
 * the paper form parents already know.
 *
 * Curves are WHO Child Growth Standards for boys, 0-6 months, at monthly steps.
 */
(function () {
  'use strict';

  // Zone fills, taken from the printed CHDR weight-for-age chart.
  const ZONE = {
    high: '#d3cae4', // above +2SD — high weight
    normal: '#abd6a4', // +2SD to -1SD — normal
    risk: '#dcefd8', // -1SD to -2SD — at risk of low weight
    moderate: '#eb9a3a', // -2SD to -3SD — moderately low
    severe: '#dd2f24', // below -3SD — severely low
  };

  const LINE_MEDIAN = '#1f5c3a';
  const LINE_TOP = '#a8306a';
  const GRID = '#cfd4d5';
  const AXIS_TEXT = '#5a6162';

  const CHARTS = {
    weight: {
      unit: 'kg',
      min: 1,
      max: 11,
      ticks: [11, 9, 7, 5, 3, 1],
      sd3: [5.0, 6.6, 8.0, 9.0, 9.7, 10.4, 10.9],
      sd2: [4.4, 5.8, 7.1, 8.0, 8.7, 9.3, 9.8],
      median: [3.3, 4.5, 5.6, 6.4, 7.0, 7.5, 7.9],
      sd1neg: [2.9, 3.9, 4.9, 5.7, 6.2, 6.7, 7.1],
      sd2neg: [2.5, 3.4, 4.3, 5.0, 5.6, 6.0, 6.4],
      sd3neg: [2.1, 2.9, 3.8, 4.4, 4.9, 5.3, 5.7],
      plotted: [[0, 3.1], [1, 4.2], [1.8, 4.8]],
    },
    height: {
      unit: 'cm',
      min: 44,
      max: 74,
      ticks: [74, 68, 62, 56, 50, 44],
      sd3: [55.6, 60.6, 64.4, 67.6, 70.1, 72.2, 74.0],
      sd2: [53.7, 58.6, 62.4, 65.5, 68.0, 70.1, 71.9],
      median: [49.9, 54.7, 58.4, 61.4, 63.9, 65.9, 67.6],
      sd1neg: [48.0, 52.8, 56.4, 59.4, 61.8, 63.8, 65.5],
      sd2neg: [46.1, 50.8, 54.4, 57.3, 59.7, 61.7, 63.3],
      sd3neg: [44.2, 48.9, 52.4, 55.3, 57.6, 59.6, 61.2],
      plotted: [[0, 49.5], [1, 54.0], [1.8, 58.0]],
    },
    head: {
      unit: 'cm',
      min: 30,
      max: 48,
      ticks: [48, 44, 40, 36, 32],
      sd3: [38.3, 40.8, 42.6, 44.1, 45.2, 46.2, 47.0],
      sd2: [37.0, 39.6, 41.5, 42.9, 44.0, 45.0, 45.8],
      median: [34.5, 37.3, 39.1, 40.5, 41.6, 42.6, 43.3],
      sd1neg: [33.2, 36.1, 37.9, 39.3, 40.4, 41.4, 42.1],
      sd2neg: [31.9, 34.9, 36.8, 38.1, 39.2, 40.1, 40.9],
      sd3neg: [30.7, 33.7, 35.6, 36.9, 38.0, 38.9, 39.7],
      plotted: [[0, 34.2], [1, 37.0], [1.8, 39.0]],
    },
  };

  const LEFT = 40;
  const RIGHT = 330;
  const TOP = 20;
  const BOTTOM = 170;
  const MONTHS = 6;

  function xOf(month) {
    return LEFT + (month / MONTHS) * (RIGHT - LEFT);
  }

  function yOf(spec, value) {
    const ratio = (value - spec.min) / (spec.max - spec.min);
    return BOTTOM - ratio * (BOTTOM - TOP);
  }

  function pointsOf(spec, series) {
    return series.map((value, index) => [xOf(index), yOf(spec, value)]);
  }

  // Catmull-Rom through the monthly points, so the curves read as growth curves
  // rather than a run of straight segments.
  function curve(points) {
    if (points.length < 2) return '';
    let d = 'M' + round(points[0]);
    for (let i = 0; i < points.length - 1; i += 1) {
      const p0 = points[i - 1] || points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2] || p2;
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += ' C' + round(c1) + ' ' + round(c2) + ' ' + round(p2);
    }
    return d;
  }

  function round(point) {
    return point[0].toFixed(1) + ',' + point[1].toFixed(1);
  }

  // A filled zone between two curves, or between a curve and a chart edge.
  function band(upper, lower, fill) {
    const back = curve(lower.slice().reverse()).replace('M', 'L');
    return '<path d="' + curve(upper) + ' ' + back + ' Z" fill="' + fill + '"/>';
  }

  function edge(y) {
    return [[xOf(0), y], [xOf(MONTHS), y]];
  }

  function render(key) {
    const spec = CHARTS[key];
    const sd3 = pointsOf(spec, spec.sd3);
    const sd2 = pointsOf(spec, spec.sd2);
    const median = pointsOf(spec, spec.median);
    const sd1neg = pointsOf(spec, spec.sd1neg);
    const sd2neg = pointsOf(spec, spec.sd2neg);
    const sd3neg = pointsOf(spec, spec.sd3neg);

    let svg =
      '<svg viewBox="0 0 340 200" width="100%" style="display:block;height:auto" role="img" aria-label="' +
      key +
      ' for age, plotted on the Sri Lanka growth chart">';

    // Zones, painted from the top down.
    svg += band(edge(TOP), sd2, ZONE.high);
    svg += band(sd2, sd1neg, ZONE.normal);
    svg += band(sd1neg, sd2neg, ZONE.risk);
    svg += band(sd2neg, sd3neg, ZONE.moderate);
    svg += band(sd3neg, edge(BOTTOM), ZONE.severe);

    // Grid.
    svg += '<g stroke="' + GRID + '" stroke-width="0.6" opacity="0.75">';
    spec.ticks.forEach((tick) => {
      const y = yOf(spec, tick).toFixed(1);
      svg += '<line x1="' + LEFT + '" y1="' + y + '" x2="' + RIGHT + '" y2="' + y + '"/>';
    });
    for (let month = 0; month <= MONTHS; month += 1) {
      const x = xOf(month).toFixed(1);
      svg += '<line x1="' + x + '" y1="' + TOP + '" x2="' + x + '" y2="' + BOTTOM + '"/>';
    }
    svg += '</g>';

    // Reference lines: +3SD and the median, as printed on the form.
    svg += '<path d="' + curve(sd3) + '" fill="none" stroke="' + LINE_TOP + '" stroke-width="1.2"/>';
    svg += '<path d="' + curve(median) + '" fill="none" stroke="' + LINE_MEDIAN + '" stroke-width="1.2"/>';
    svg +=
      '<rect x="' + LEFT + '" y="' + TOP + '" width="' + (RIGHT - LEFT) + '" height="' +
      (BOTTOM - TOP) + '" fill="none" stroke="#9aa1a1" stroke-width="0.8"/>';

    // This child's measurements.
    const plotted = spec.plotted.map((point) => [xOf(point[0]), yOf(spec, point[1])]);
    svg += '<path d="' + curve(plotted) + '" fill="none" stroke="#191c1d" stroke-width="2.2" stroke-linecap="round"/>';
    plotted.forEach((point, index) => {
      const last = index === plotted.length - 1;
      svg +=
        '<circle cx="' + point[0].toFixed(1) + '" cy="' + point[1].toFixed(1) + '" r="' +
        (last ? 4.5 : 3) + '" fill="#191c1d" stroke="#fff" stroke-width="' + (last ? 2 : 1) + '"/>';
    });

    // Axes.
    svg += '<g font-family="Plus Jakarta Sans, sans-serif" font-size="9" fill="' + AXIS_TEXT + '">';
    svg += '<text x="34" y="14" text-anchor="end">' + spec.unit + '</text>';
    spec.ticks.forEach((tick) => {
      svg += '<text x="34" y="' + (yOf(spec, tick) + 3).toFixed(1) + '" text-anchor="end">' + tick + '</text>';
    });
    svg += '</g>';
    svg += '<g font-family="Plus Jakarta Sans, sans-serif" font-size="9" fill="' + AXIS_TEXT + '" text-anchor="middle">';
    [0, 2, 4, 6].forEach((month) => {
      svg += '<text x="' + xOf(month).toFixed(1) + '" y="186">' + month + 'mo</text>';
    });
    svg += '</g>';

    return svg + '</svg>';
  }

  document.querySelectorAll('[data-chart]').forEach((host) => {
    const key = host.dataset.chart;
    if (CHARTS[key]) host.innerHTML = render(key);
  });
})();
