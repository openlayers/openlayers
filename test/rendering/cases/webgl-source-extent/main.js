import Map from '../../../../src/ol/Map.js';
import TileGrid from '../../../../src/ol/tilegrid/TileGrid.js';
import TileLayer from '../../../../src/ol/layer/WebGLTile.js';
import View from '../../../../src/ol/View.js';
import XYZ from '../../../../src/ol/source/XYZ.js';
import {getHeight, getWidth} from '../../../../src/ol/extent.js';
import {get as getProjection} from '../../../../src/ol/proj.js';

const fullExtent = getProjection('EPSG:3857').getExtent();
const width = getWidth(fullExtent);
const height = getHeight(fullExtent);

const partialExtent = [
  fullExtent[0],
  fullExtent[1] + 0.4 * height,
  fullExtent[2] - 0.4 * width,
  fullExtent[3],
];

function resolutionsFromExtent(extent, maxZoom) {
  const height = getHeight(extent);
  const width = getWidth(extent);

  const maxResolution = Math.max(width / 256, height / 256);

  const length = maxZoom + 1;
  const resolutions = new Array(length);
  for (let z = 0; z < length; ++z) {
    resolutions[z] = maxResolution / Math.pow(2, z);
  }
  return resolutions;
}

new Map({
  layers: [
    new TileLayer({
      source: new XYZ({
        wrapX: false,
        url: '/data/tiles/satellite/{z}/{x}/{y}.jpg',
        transition: 0,
        tileGrid: new TileGrid({
          extent: partialExtent,
          resolutions: resolutionsFromExtent(fullExtent, 10),
        }),
      }),
    }),
  ],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 0,
    rotation: -Math.PI / 8,
  }),
});

render({
  message: 'data outside the source tile grid extent is not rendered',
});
