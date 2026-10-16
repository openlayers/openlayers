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
 * @typedef {Object} Sprite
 * @property {string} prefix Prefix of image names in the style.
 * @property {Object<string, Object>} images Image metadata by name.
 * @property {HTMLCanvasElement} canvas Sprite image.
 * @property {string} url Object URL of the sprite image.
 */

/**
 * Loads the sprite of a style. Its SDF images hold the distance to the edge of
 * the shape instead of colors, so they are converted to white images, which
 * `icon-color` tints.
 * @param {string|Array<{id: string, url: string}>} sprite Sprite of the style.
 * @return {Promise<Sprite>} Sprite.
 */
function loadSprite(sprite) {
  const {id, url} =
    typeof sprite === 'string' ? {id: '', url: sprite} : sprite[0];
  return Promise.all([
    fetch(url + '.json').then((response) => response.json()),
    fetch(url + '.png')
      .then((response) => response.blob())
      .then((blob) => createImageBitmap(blob)),
  ]).then(([images, image]) => {
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const context = canvas.getContext('2d', {willReadFrequently: true});
    context.drawImage(image, 0, 0);
    for (const name in images) {
      const {x, y, width, height, sdf} = images[name];
      if (!sdf) {
        continue;
      }
      const imageData = context.getImageData(x, y, width, height);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        // The edge is at a distance of 0.75, antialiased over 0.2.
        const distance = data[i + 3] / 255;
        data[i] = 255;
        data[i + 1] = 255;
        data[i + 2] = 255;
        data[i + 3] = 255 * Math.min(1, Math.max(0, (distance - 0.65) / 0.2));
      }
      context.putImageData(imageData, x, y);
    }
    return new Promise((resolve) => canvas.toBlob(resolve)).then((blob) => ({
      prefix: id ? id + ':' : '',
      images,
      canvas,
      url: URL.createObjectURL(blob),
    }));
  });
}

/**
 * @param {Sprite} sprite Sprite.
 * @param {string} name Image name in the style.
 * @return {Object|undefined} Image metadata.
 */
function spriteImage(sprite, name) {
  return name.startsWith(sprite.prefix)
    ? sprite.images[name.slice(sprite.prefix.length)]
    : undefined;
}

/**
 * Flat styles cannot set the opacity of a fill pattern, so it is part of the
 * pattern image, at the opacity of the highest zoom stop.
 * @param {Sprite} sprite Sprite.
 * @param {string} name Image name in the style.
 * @param {*} opacity Opacity or opacity expression.
 * @return {string|undefined} Pattern image URL.
 */
function patternSrc(sprite, name, opacity = 1) {
  const image = spriteImage(sprite, name);
  if (!image) {
    return undefined;
  }
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const context = canvas.getContext('2d');
  context.globalAlpha =
    typeof opacity === 'number' ? opacity : opacity[opacity.length - 1];
  context.drawImage(
    sprite.canvas,
    image.x,
    image.y,
    image.width,
    image.height,
    0,
    0,
    image.width,
    image.height,
  );
  return canvas.toDataURL();
}

/**
 * @param {Object} layer Mapbox GL fill layer.
 * @param {Sprite} sprite Sprite.
 * @return {Array<Object>} Rules, with filters to add to the layer filter.
 */
function fillRules(layer, sprite) {
  const paint = layer.paint || {};
  const opacity = paint['fill-opacity'];
  if (paint['fill-pattern']) {
    const src = patternSrc(sprite, paint['fill-pattern'], opacity);
    return src ? [{style: {'fill-pattern-src': src}}] : [];
  }
  const style = {
    'fill-color': color(paint['fill-color'] || '#000', opacity),
  };
  if (paint['fill-outline-color']) {
    style['stroke-color'] = color(paint['fill-outline-color'], opacity);
    style['stroke-width'] = 1;
  }
  return [{style}];
}

/**
 * @param {Object} layer Mapbox GL line layer.
 * @return {Array<Object>} Rules, with filters to add to the layer filter.
 */
function lineRules(layer) {
  const layout = layer.layout || {};
  const paint = layer.paint || {};
  const width = paint['line-width'] ?? 1;
  const style = {
    'stroke-color': color(paint['line-color'] || '#000', paint['line-opacity']),
    'stroke-width': translate(width),
    'stroke-line-cap': layout['line-cap'] || 'butt',
    'stroke-line-join': layout['line-join'] || 'miter',
  };
  const dash = paint['line-dasharray'];
  if (dash) {
    // Mapbox GL dash lengths are in line widths.
    style['stroke-line-dash'] =
      typeof width === 'number'
        ? dash.map((length) => length * width)
        : ['array', ...dash.map((length) => ['*', length, translate(width)])];
  }
  return [{style}];
}

/**
 * Splits an `icon-image` value by image, because `icon-src` cannot be an
 * expression.
 * @param {*} value Icon image.
 * @return {Array<Array<*>>} Pairs of a filter (if any) and an image name.
 */
function iconImages(value) {
  if (typeof value === 'string') {
    return [[undefined, value]];
  }
  if (!Array.isArray(value) || value[0] !== 'match') {
    return [[undefined, '']];
  }
  const input = translate(value[1]);
  const fallback = value[value.length - 1];
  const valuesByName = {};
  const allValues = [];
  for (let i = 2; i < value.length - 1; i += 2) {
    const values = Array.isArray(value[i]) ? value[i] : [value[i]];
    valuesByName[value[i + 1]] = (valuesByName[value[i + 1]] || []).concat(
      values,
    );
    allValues.push(...values);
  }
  const images = Object.entries(valuesByName).map(([name, values]) => [
    ['in', input, ['literal', values]],
    name,
  ]);
  images.push([['!', ['in', input, ['literal', allValues]]], fallback]);
  return images;
}

/**
 * @param {Object} layer Mapbox GL symbol layer.
 * @param {Sprite} sprite Sprite.
 * @param {string} name Image name.
 * @return {Object|undefined} Flat style.
 */
function iconStyle(layer, sprite, name) {
  const image = spriteImage(sprite, name);
  if (!image) {
    return undefined;
  }
  const layout = layer.layout || {};
  const paint = layer.paint || {};
  const size = layout['icon-size'] ?? 1;
  const anchor = layout['icon-anchor'] || 'center';
  const style = {
    'icon-src': sprite.url,
    'icon-offset': [image.x, image.y],
    'icon-size': [image.width, image.height],
    'icon-scale':
      typeof size === 'number'
        ? size / image.pixelRatio
        : ['/', translate(size), image.pixelRatio],
    'icon-anchor': [
      anchor.includes('left') ? 0 : anchor.includes('right') ? 1 : 0.5,
      anchor.includes('top') ? 0 : anchor.includes('bottom') ? 1 : 0.5,
    ],
  };
  if (image.sdf) {
    style['icon-color'] = paint['icon-color'] || '#000';
  }
  if (paint['icon-opacity'] !== undefined) {
    style['icon-opacity'] = translate(paint['icon-opacity']);
  }
  return style;
}

/**
 * @param {Object} layer Mapbox GL symbol layer.
 * @param {Sprite} sprite Sprite.
 * @return {Array<Object>} Rules, with filters to add to the layer filter.
 */
function symbolRules(layer, sprite) {
  const layout = layer.layout || {};
  const text = layout['text-field'] ? textStyle(layer) : undefined;
  if (!text && layout['symbol-placement'] === 'line') {
    // Flat styles cannot repeat icons along lines, e.g. one-way arrows.
    return [];
  }
  const rules = [];
  for (const [filter, name] of iconImages(layout['icon-image'])) {
    const icon = iconStyle(layer, sprite, name);
    if (icon || text) {
      rules.push({filter, style: {...text, ...icon}});
    }
  }
  return rules;
}

/**
 * @param {Object} layer Mapbox GL symbol layer.
 * @return {Object} Flat style.
 */
function textStyle(layer) {
  const layout = layer.layout || {};
  const paint = layer.paint || {};
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
    style['text-stroke-color'] = color(
      paint['text-halo-color'] || '#000',
      paint['text-opacity'],
    );
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
 * @param {*} [ruleFilter] Filter of one of the rules of the layer.
 * @return {*} Filter expression.
 */
function filter(layer, ruleFilter) {
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
  if (ruleFilter) {
    conditions.push(ruleFilter);
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

const ruleBuilders = {
  fill: fillRules,
  line: lineRules,
  symbol: symbolRules,
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
  fetch(styleUrl)
    .then((response) => response.json())
    .then((glStyle) =>
      loadSprite(glStyle.sprite).then((sprite) => [glStyle, sprite]),
    ),
  document.fonts.load(`12px ${fontFamily}`),
  document.fonts.load(`bold 12px ${fontFamily}`),
]).then(([[glStyle, sprite]]) => {
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
    for (const rule of ruleBuilders[layer.type]?.(layer, sprite) ?? []) {
      rule.style['z-index'] = zIndex(layer, index);
      rules.push({filter: filter(layer, rule.filter), style: rule.style});
    }
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
