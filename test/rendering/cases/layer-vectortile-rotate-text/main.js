import MVT from '../../../../src/ol/format/MVT.js';
import Map from '../../../../src/ol/Map.js';
import VectorTileLayer from '../../../../src/ol/layer/VectorTile.js';
import VectorTileSource from '../../../../src/ol/source/VectorTile.js';
import View from '../../../../src/ol/View.js';
import {Stroke, Style, Text} from '../../../../src/ol/style.js';
import {createXYZ} from '../../../../src/ol/tilegrid.js';

new Map({
  layers: [
    new VectorTileLayer({
      style: function (feature, resolution) {
        const name = feature.get('name');
        if (feature.getGeometry().getType() === 'LineString' && name) {
          return new Style({
            stroke: new Stroke({
              width: 2,
              color: 'red',
            }),
            text: new Text({
              text: name,
              font: 'italic bold 18px Ubuntu',
              placement: 'line',
            }),
          });
        }
      },
      source: new VectorTileSource({
        format: new MVT(),
        tileGrid: createXYZ(),
        url: '/data/tiles/mapbox-streets-v6/{z}/{x}/{y}.vector.pbf',
        transition: 0,
      }),
    }),
  ],
  target: 'map',
  view: new View({
    center: [1825927.7316762917, 6143091.089223046],
    rotation: Math.PI / 2,
    zoom: 14,
  }),
});

render({message: 'Vector tile layer has upright labels', tolerance: 0.01});
