import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import {asArray} from '../src/ol/color.js';
import {newEvaluationContext} from '../src/ol/expr/cpu.js';
import {newParsingContext} from '../src/ol/expr/expression.js';
import MVT from '../src/ol/format/MVT.js';
import Link from '../src/ol/interaction/Link.js';
import VectorTileLayer from '../src/ol/layer/VectorTile.js';
import WebGPUVectorTileLayer from '../src/ol/layer/WebGPUVectorTile.js';
import {fromLonLat} from '../src/ol/proj.js';
import {buildRuleSet} from '../src/ol/render/canvas/style.js';
import VectorTileSource from '../src/ol/source/VectorTile.js';

const styleUrl =
  'https://tiles.versatiles.org/assets/styles/colorful/style.json';

// Mapbox GL zoom levels are based on 512 pixel tiles. With the same resolution
// at zoom level 0, view zoom levels match the zoom levels of the style.
const maxResolution = 78271.51696402048;

const fontFamily = '"Noto Sans", sans-serif';

/**
 * Translates a Mapbox GL expression into an OpenLayers expression. Only the
 * operators used by the VersaTiles styles need special handling.
 * @param {*} expression Mapbox GL expression.
 * @return {*} OpenLayers expression.
 */
function translate(expression) {
  if (!Array.isArray(expression)) {
    return expression;
  }
  const [operator, ...args] = expression;
  switch (operator) {
    case 'get':
    case 'has':
      return expression;
    case 'interpolate':
      return [operator, args[0], ...args.slice(1).map(translate)];
    case 'in': {
      const needle = translate(args[0]);
      const values = args[1][1];
      if (values.every((value) => typeof value === typeof values[0])) {
        return ['in', needle, ['literal', values]];
      }
      // OpenLayers needs a haystack of a single type.
      return ['any', ...values.map((value) => ['==', needle, value])];
    }
    case 'all':
    case 'any':
      return args.length === 1
        ? translate(args[0])
        : [operator, ...args.map(translate)];
    case 'to-boolean':
      return ['has', args[0][1]];
    case 'to-number':
      return ['number', ...args.map(translate)];
    case '-':
      return args.length === 1
        ? ['*', -1, translate(args[0])]
        : [operator, ...args.map(translate)];
    default:
      return [operator, ...args.map(translate)];
  }
}

/**
 * @param {string} value Color.
 * @param {*} [opacity] Opacity or opacity expression.
 * @return {*} Color or color expression.
 */
function color(value, opacity = 1) {
  const [r, g, b, a] = asArray(value);
  if (typeof opacity === 'number') {
    return [r, g, b, a * opacity];
  }
  return ['color', r, g, b, ['*', a, translate(opacity)]];
}

/**
 * Makes sure that a text expression evaluates to a string, because the tiles
 * also have numeric values, e.g. for house numbers.
 * @param {*} expression Expression.
 * @return {*} String expression.
 */
function stringify(expression) {
  switch (expression[0]) {
    case 'get':
      return ['case', ['has', expression[1]], ['to-string', expression], ''];
    case 'case':
      return expression.map((arg, i) =>
        i > 0 && (i % 2 === 0 || i === expression.length - 1)
          ? stringify(arg)
          : arg,
      );
    default:
      return expression;
  }
}

/**
 * @param {*} value Text field.
 * @return {*} Text value expression.
 */
function textValue(value) {
  if (typeof value === 'string') {
    const match = value.match(/^\{(.+)\}$/);
    if (!match) {
      return value;
    }
    value = ['get', match[1]];
  }
  return stringify(translate(value));
}

/**
 * @param {Object} layout Symbol layout.
 * @return {*} Font or font expression.
 */
function font(layout) {
  const fontName = layout['text-font']?.[0] || '';
  const weight = fontName.includes('bold') ? 'bold' : 'normal';
  const size = layout['text-size'] ?? 16;
  if (typeof size === 'number') {
    return `${weight} ${size}px ${fontFamily}`;
  }
  return [
    'concat',
    `${weight} `,
    ['to-string', ['round', translate(size)]],
    `px ${fontFamily}`,
  ];
}

/**
 * @param {*} size Text size.
 * @param {number} ems Offset in ems.
 * @return {*} Offset in pixels.
 */
function emsToPixels(size, ems) {
  if (typeof size === 'number') {
    return ems * size;
  }
  return ['*', ems, translate(size)];
}

/**
 * @param {Object} layer Mapbox GL fill layer.
 * @return {Object|undefined} Flat style.
 */
function fillStyle(layer) {
  const paint = layer.paint || {};
  if (paint['fill-pattern']) {
    return undefined;
  }
  const opacity = paint['fill-opacity'];
  const style = {
    'fill-color': color(paint['fill-color'] || '#000', opacity),
  };
  if (paint['fill-outline-color']) {
    style['stroke-color'] = color(paint['fill-outline-color'], opacity);
    style['stroke-width'] = 1;
  }
  return style;
}

/**
 * @param {Object} layer Mapbox GL line layer.
 * @return {Object} Flat style.
 */
function lineStyle(layer) {
  const paint = layer.paint || {};
  return {
    'stroke-color': color(paint['line-color'] || '#000', paint['line-opacity']),
    'stroke-width': translate(paint['line-width'] ?? 1),
  };
}

/**
 * @param {Object} layer Mapbox GL symbol layer.
 * @return {Object|undefined} Flat style.
 */
function symbolStyle(layer) {
  const layout = layer.layout || {};
  const paint = layer.paint || {};
  if (!layout['text-field']) {
    return undefined;
  }
  const size = layout['text-size'] ?? 16;
  const anchor = layout['text-anchor'] || 'center';
  const [offsetX, offsetY] = layout['text-offset'] || [0, 0];
  const padding = layout['text-padding'] ?? 2;
  const style = {
    'text-value': textValue(layout['text-field']),
    'text-font': font(layout),
    'text-fill-color': color(
      paint['text-color'] || '#000',
      paint['text-opacity'],
    ),
    'text-placement': layout['symbol-placement'] === 'line' ? 'line' : 'point',
    'text-align': anchor.includes('left')
      ? 'left'
      : anchor.includes('right')
        ? 'right'
        : 'center',
    'text-baseline': anchor.includes('top')
      ? 'top'
      : anchor.includes('bottom')
        ? 'bottom'
        : 'middle',
    'text-offset-x': emsToPixels(size, offsetX),
    'text-offset-y': emsToPixels(size, offsetY),
    'text-padding': [padding, padding, padding, padding],
  };
  const haloWidth = paint['text-halo-width'] ?? 0;
  if (haloWidth > 0) {
    style['text-stroke-color'] = color(paint['text-halo-color'] || '#000');
    // Canvas strokes are centered on the glyph outline.
    style['text-stroke-width'] = 2 * haloWidth;
  }
  return style;
}

/**
 * The z-index of a style layer: its position in the style, so later layers
 * draw on top and win declutter. A `symbol-sort-key` adds a fraction within
 * (-0.5, 0.5), so it orders features of one layer without passing a neighbor.
 * @param {Object} layer Mapbox GL layer.
 * @param {number} index Layer index.
 * @return {*} Z-index or z-index expression.
 */
function zIndex(layer, index) {
  const sortKey = layer.layout?.['symbol-sort-key'];
  if (!sortKey) {
    return index;
  }
  // Mapbox GL places low sort keys first, OpenLayers places high z-index first.
  const key = ['*', -1, translate(sortKey)];
  return ['+', index, ['/', ['*', 0.49, key], ['+', ['abs', key], 1e6]]];
}

/**
 * @param {Object} layer Mapbox GL layer.
 * @return {*} Filter expression.
 */
function filter(layer) {
  const conditions = [['==', ['get', 'mvt:layer'], layer['source-layer']]];
  // Mapbox GL layers are visible from minzoom up to, but not including, maxzoom.
  if (layer.minzoom !== undefined) {
    conditions.push(['>=', ['zoom'], layer.minzoom]);
  }
  if (layer.maxzoom !== undefined) {
    conditions.push(['<', ['zoom'], layer.maxzoom]);
  }
  if (layer.filter) {
    conditions.push(translate(layer.filter));
  }
  return conditions.length === 1 ? conditions[0] : ['all', ...conditions];
}

/**
 * Creates a Canvas2D style function for flat style rules. Canvas2D style
 * functions do not provide `['zoom']`, so it is derived from the view.
 * @param {Array<Object>} rules Flat style rules.
 * @param {View} view View.
 * @return {import('../src/ol/style/Style.js').StyleFunction} Style function.
 */
function canvasStyleFunction(rules, view) {
  const evaluate = buildRuleSet(rules, newParsingContext());
  const context = newEvaluationContext();
  return (feature, resolution) => {
    context.properties = feature.getPropertiesInternal() ?? {};
    context.resolution = resolution;
    context.zoom = view.getZoomForResolution(resolution);
    return evaluate(context);
  };
}

const styleBuilders = {
  fill: fillStyle,
  line: lineStyle,
  symbol: symbolStyle,
};

/**
 * @param {string} label Pane label.
 * @return {HTMLElement} Map target element.
 */
function createPane(label) {
  const pane = document.createElement('div');
  pane.style.cssText = 'position: relative; flex: 1 1 0; min-width: 0';
  const target = document.createElement('div');
  target.className = 'map';
  target.style.width = '100%';
  const labelElement = document.createElement('div');
  labelElement.textContent = label;
  labelElement.style.cssText =
    'position: absolute; top: .5em; left: 3em; padding: 2px 8px;' +
    'background: rgba(255, 255, 255, .8); border-radius: 4px;' +
    'font-weight: bold; pointer-events: none';
  pane.append(target, labelElement);
  return pane;
}

const container = document.getElementById('map');
container.removeAttribute('class');
container.style.cssText = 'display: flex; gap: 4px';
const canvasPane = createPane('Canvas2D');
const webgpuPane = createPane('WebGPU');
container.append(canvasPane, webgpuPane);

const view = new View({
  center: fromLonLat([13.388, 52.517]),
  zoom: 13,
  maxResolution,
});

const canvasMap = new Map({
  target: canvasPane.firstElementChild,
  view,
});
const webgpuMap = new Map({
  target: webgpuPane.firstElementChild,
  view,
});

Promise.all([
  fetch(styleUrl).then((response) => response.json()),
  document.fonts.load(`12px ${fontFamily}`),
  document.fonts.load(`bold 12px ${fontFamily}`),
]).then(([glStyle]) => {
  const sourceId = Object.keys(glStyle.sources)[0];
  const glSource = glStyle.sources[sourceId];
  const createSource = () =>
    new VectorTileSource({
      attributions: glSource.attribution,
      format: new MVT({layerName: 'mvt:layer'}),
      url: glSource.tiles[0],
      maxZoom: glSource.maxzoom,
    });

  const rules = [];
  glStyle.layers.forEach((layer, index) => {
    if (layer.type === 'background') {
      const paint = layer.paint || {};
      if (paint['background-color']) {
        canvasMap.getTargetElement().style.background =
          paint['background-color'];
        webgpuMap.getTargetElement().style.background =
          paint['background-color'];
      }
      return;
    }
    const style = styleBuilders[layer.type]?.(layer);
    if (!style) {
      return;
    }
    style['z-index'] = zIndex(layer, index);
    rules.push({filter: filter(layer), style});
  });

  canvasMap.addLayer(
    new VectorTileLayer({
      source: createSource(),
      style: canvasStyleFunction(rules, view),
      declutter: true,
    }),
  );
  webgpuMap.addLayer(
    new WebGPUVectorTileLayer({
      source: createSource(),
      style: rules,
      declutter: true,
    }),
  );
  canvasMap.addInteraction(new Link());
});
