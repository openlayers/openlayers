import {applyBackground, applyStyle} from 'ol-mapbox-style';
import Map from '../../../src/ol/Map.js';
import View from '../../../src/ol/View.js';
import MVT from '../../../src/ol/format/MVT.js';
import VectorTileSource from '../../../src/ol/source/VectorTile.js';
import {createRules, loadSprite} from './versatiles-flat-style.js';

/** Center shared by the WebGPU and Canvas VersaTiles cases. */
export const versatilesCenter = [1813976.46267, 6141328.17996];

/** Zoom shared by the WebGPU and Canvas VersaTiles cases. */
export const versatilesZoom = 15;

/** Maximum source zoom; navigation at z15 exercises overzoomed render tiles. */
export const versatilesSourceMaxZoom = 14;

const stylePath = 'data/versatiles/style.json';

/**
 * Builds a map from the offline VersaTiles Colorful style.
 * Both renderer cases use this view, source, and style.
 * @param {HTMLElement} target Map target.
 * @param {function(new:import('../../../src/ol/layer/Layer.js').default, Object)} LayerClass Vector tile layer constructor.
 * @return {Promise<{map: import('../../../src/ol/Map.js').default}|{unavailable: string}>} Prepared map, or why it cannot run.
 */
export async function createVersatilesMap(target, LayerClass) {
  const response = await fetch(stylePath);
  if (!response.ok) {
    return {
      unavailable:
        'Fixture not installed. Run npm run fetch-bench-fixtures and reload.',
    };
  }
  const style = await response.json();
  const layer = new LayerClass({
    declutter: true,
    source: new VectorTileSource({}),
  });
  const view = new View({
    center: versatilesCenter,
    zoom: versatilesZoom,
    maxResolution: 78271.51696402048,
  });
  const map = new Map({layers: [layer], target, view});
  const options = {
    styleUrl: new URL(stylePath, location.href).href,
    webfonts: 'data/versatiles/fonts/{font-family}/{fontweight}.css',
  };
  await Promise.all([
    applyStyle(layer, style, options),
    applyBackground(layer, style, options),
  ]);
  return {map};
}

/**
 * Builds a map from the same offline VersaTiles Colorful style, but gives the
 * layer an array of flat style rules, as the `webgpu-versatiles` example does,
 * instead of the style function that `ol-mapbox-style` creates.
 * @param {HTMLElement} target Map target.
 * @param {function(new:import('../../../src/ol/layer/Layer.js').default, Object)} LayerClass Vector tile layer constructor.
 * @return {Promise<{map: import('../../../src/ol/Map.js').default}|{unavailable: string}>} Prepared map, or why it cannot run.
 */
export async function createVersatilesFlatMap(target, LayerClass) {
  const response = await fetch(stylePath);
  if (!response.ok) {
    return {
      unavailable:
        'Fixture not installed. Run npm run fetch-bench-fixtures and reload.',
    };
  }
  const glStyle = await response.json();
  const base = new URL('data/versatiles/', location.href).href;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = base + 'fonts/noto_sans_regular/400.css';
  const stylesheetLoaded = new Promise((resolve) => {
    link.addEventListener('load', resolve, {once: true});
    link.addEventListener('error', resolve, {once: true});
  });
  document.head.append(link);
  const sprite = await loadSprite([
    {id: glStyle.sprite[0].id, url: base + glStyle.sprite[0].url},
  ]);
  await stylesheetLoaded;
  await document.fonts.load('12px noto_sans_regular');
  const sourceId = Object.keys(glStyle.sources)[0];
  const layer = new LayerClass({
    declutter: true,
    source: new VectorTileSource({
      format: new MVT({layerName: 'mvt:layer'}),
      url: base + glStyle.sources[sourceId].tiles[0],
      maxZoom: glStyle.sources[sourceId].maxzoom,
    }),
    style: createRules(glStyle, sprite),
  });
  const view = new View({
    center: versatilesCenter,
    zoom: versatilesZoom,
    maxResolution: 78271.51696402048,
  });
  const map = new Map({layers: [layer], target, view});
  const background = glStyle.layers.find(
    (glLayer) => glLayer.type === 'background',
  )?.paint?.['background-color'];
  if (background) {
    target.style.background = background;
  }
  return {map};
}
