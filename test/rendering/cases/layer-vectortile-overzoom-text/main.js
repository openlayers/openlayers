import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import MVT from '../../../../src/ol/format/MVT.js';
import VectorTileLayer from '../../../../src/ol/layer/VectorTile.js';
import VectorTileSource from '../../../../src/ol/source/VectorTile.js';
import {createXYZ} from '../../../../src/ol/tilegrid.js';

// A single z14 tile rendered at a much higher zoom (overzoom). The straight
// streets crossing the tile have their only vertices at the tile edges, far
// outside the small rendered area. Labels must still be placed, which requires
// clipping the lines to the rendered extent first. The North-South streets in
// particular have no vertex anywhere near the rendered area.

new Map({
  pixelRatio: 1,
  layers: [
    new VectorTileLayer({
      declutter: false,
      style: {
        'stroke-color': '#888',
        'stroke-width': 2,
        'text-value': ['get', 'name'],
        'text-font': 'bold 14px Ubuntu',
        'text-placement': 'line',
        'text-fill-color': '#000',
        'text-stroke-color': '#FFF',
        'text-stroke-width': 2,
      },
      source: new VectorTileSource({
        format: new MVT({layers: ['transportation_name']}),
        tileGrid: createXYZ({maxZoom: 14}),
        url: '/data/tiles/openfreemap/{z}/{x}/{y}.pbf',
        transition: 0,
      }),
    }),
  ],
  target: 'map',
  view: new View({
    center: [-9919966.351580823, 5198589.182519725],
    zoom: 18.65,
  }),
});

render({
  message: 'Labels are placed on overzoomed straight streets',
  tolerance: 0.01,
});
