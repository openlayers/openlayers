import Map from '../../../../src/ol/Map.js';
import TileLayer from '../../../../src/ol/layer/WebGLTile.js';
import View from '../../../../src/ol/View.js';
import XYZ from '../../../../src/ol/source/XYZ.js';

const map = new Map({
  layers: [
    new TileLayer({
      source: new XYZ({
        minZoom: 0,
        maxZoom: 0,
        url: '/data/tiles/osm/{z}/{x}/{y}.png',
      }),
    }),
  ],
  target: 'map',
  view: new View({
    projection: 'EPSG:4326',
    center: [0, 0],
    zoom: 0,
    multiWorld: true,
  }),
});

map.once('rendercomplete', function () {
  map.setView(
    new View({
      projection: 'EPSG:3857',
      center: [0, 0],
      zoom: 0,
      multiWorld: true,
    })
  );
  render({tolerance: 0.03});
});
