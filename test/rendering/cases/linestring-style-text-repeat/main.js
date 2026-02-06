import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import MVT from '../../../../src/ol/format/MVT.js';
import VectorTileLayer from '../../../../src/ol/layer/VectorTile.js';
import VectorTileSource from '../../../../src/ol/source/VectorTile.js';
import Stroke from '../../../../src/ol/style/Stroke.js';
import Style from '../../../../src/ol/style/Style.js';
import Text from '../../../../src/ol/style/Text.js';

new Map({
  layers: [
    new VectorTileLayer({
      style(feature) {
        if (feature.get('class')?.startsWith('street') && feature.get('name')) {
          return new Style({
            text: new Text({
              font: '16px ubuntu',
              placement: 'line',
              repeat: 200,
              text: feature.get('name'),
              stroke: new Stroke({
                width: 3,
                color: 'white',
              }),
            }),
            stroke: new Stroke({
              width: 2,
              color: 'red',
            }),
          });
        }
      },
      source: new VectorTileSource({
        format: new MVT(),
        url: '/data/tiles/mapbox-streets-v6/{z}/{x}/{y}.vector.pbf',
        minZoom: 14,
        maxZoom: 14,
        transition: 0,
      }),
    }),
  ],
  target: 'map',
  view: new View({
    center: [1825438, 6142626],
    zoom: 16.5,
  }),
});

render({
  message: 'Vector tile layer renders',
  tolerance: 0.02,
});
