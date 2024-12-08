import {PMTiles} from 'pmtiles';
import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import Layer from '../src/ol/layer/WebGLTile.js';
import {useGeographic} from '../src/ol/proj.js';
import Source from '../src/ol/source/ImageTile.js';

useGeographic();

const tiles = new PMTiles(
  'https://pmtiles.io/stamen_toner(raster)CC-BY+ODbL_z3.pmtiles',
);

/**
 * @param {string} src The image source URL.
 * @return {Promise<HTMLImageElement>} Resolves with the loaded image.
 */
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener('load', () => resolve(img));
    img.addEventListener('error', () => reject(new Error('load failed')));
    img.src = src;
  });
}

const source = new Source({
  async loader(z, x, y, {signal}) {
    const response = await tiles.getZxy(z, x, y, signal);
    const blob = new Blob([response.data]);
    const src = URL.createObjectURL(blob);
    const image = await loadImage(src);
    URL.revokeObjectURL(src);
    return image;
  },
  attributions:
    'Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/4.0">CC BY 4.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://www.openstreetmap.org/copyright">ODbL</a>.',
});

const map = new Map({
  layers: [new Layer({source})],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 2,
    maxZoom: 4,
  }),
});
