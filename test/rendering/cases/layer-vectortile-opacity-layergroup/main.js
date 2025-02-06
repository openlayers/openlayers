import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import MVT from '../../../../src/ol/format/MVT.js';
import Group from '../../../../src/ol/layer/Group.js';
import VectorTileLayer from '../../../../src/ol/layer/VectorTile.js';
import VectorTileSource from '../../../../src/ol/source/VectorTile.js';
import {createXYZ} from '../../../../src/ol/tilegrid.js';

new Map({
  layers: [
    new Group({
      opacity: 0.3,
      layers: [
        new VectorTileLayer({
          declutter: true,
          source: new VectorTileSource({
            format: new MVT(),
            tileGrid: createXYZ(),
            url: '/data/tiles/mapbox-streets-v6/{z}/{x}/{y}.vector.pbf',
            transition: 0,
          }),
          style: {
            'stroke-color': 'rgba(0, 0, 255, 0.3)',
            'text-value': [
              'match',
              ['!', ['get', 'name_en']],
              true,
              '',
              ['get', 'name_en'],
            ],
          },
        }),
      ],
    }),
  ],
  target: 'map',
  view: new View({
    center: [1825927.7316762917, 6143091.089223046],
    zoom: 14,
  }),
});

render({
  message: 'Vector tile layer renders',
  tolerance: 0.02,
});
