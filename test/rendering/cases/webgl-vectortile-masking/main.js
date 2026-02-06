import Feature from '../../../../src/ol/Feature.js';
import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import Polygon from '../../../../src/ol/geom/Polygon.js';
import WebGLVectorTileLayer from '../../../../src/ol/layer/WebGLVectorTile.js';
import VectorTileSource from '../../../../src/ol/source/VectorTile.js';

const source = new VectorTileSource({
  tileSize: 64,
  url: '{z}/{x}/{y}',
  tileLoadFunction: (tile) => {
    const z = tile.tileCoord[0];
    if (z > 2 && tile.tileCoord[1] > tile.tileCoord[2]) {
      return;
    }
    const extent = source.getTileGrid().getTileCoordExtent(tile.tileCoord);
    const delta = (extent[2] - extent[0]) * 0.1;
    const square = new Polygon([
      [
        [extent[0] + 2 * delta, extent[1] + 2 * delta],
        [extent[2] - 2 * delta, extent[1] + 2 * delta],
        [extent[2] - 2 * delta, extent[3] - 2 * delta],
        [extent[0] + 2 * delta, extent[3] - 2 * delta],
        [extent[0] + 2 * delta, extent[1] + 2 * delta],
      ],
    ]);
    const innerSquare = new Polygon([
      [
        [extent[0] + 4 * delta, extent[1] + 4 * delta],
        [extent[2] - 4 * delta, extent[1] + 4 * delta],
        [extent[2] - 4 * delta, extent[3] - 4 * delta],
        [extent[0] + 4 * delta, extent[3] - 4 * delta],
        [extent[0] + 4 * delta, extent[1] + 4 * delta],
      ],
    ]);

    const features = [new Feature(square), new Feature(innerSquare)];
    tile.setFeatures(features);
  },
});

const map = new Map({
  pixelRatio: 2,
  layers: [
    new WebGLVectorTileLayer({
      source,
      style: {
        'fill-color': '#eee',
        'stroke-color': 'rgba(136,136,136, 0.5)',
        'stroke-width': 1,
        'circle-radius': 2,
        'circle-fill-color': '#707070',
      },
    }),
  ],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 0,
    rotation: Math.PI / 8,
  }),
});
map.renderSync();
setTimeout(() => {
  map.getView().setZoom(1);
  map.renderSync();
  setTimeout(() => {
    render({
      message:
        'Vector tiles from lower zoom levels are hidden by higher zoom levels',
      tolerance: 0.001,
    });
  });
});
