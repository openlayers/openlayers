import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import MVT from '../../../../src/ol/format/MVT.js';
import VectorTileLayer from '../../../../src/ol/layer/VectorTile.js';
import VectorTileSource from '../../../../src/ol/source/VectorTile.js';
import Fill from '../../../../src/ol/style/Fill.js';
import Stroke from '../../../../src/ol/style/Stroke.js';
import Style from '../../../../src/ol/style/Style.js';
import Text from '../../../../src/ol/style/Text.js';
import {createXYZ} from '../../../../src/ol/tilegrid.js';

// A single z14 tile rendered at a much higher zoom (overzoom). The straight
// streets crossing the tile have their only vertices at the tile edges, far
// outside the small rendered area. Labels must still be placed, which requires
// clipping the lines to the rendered extent first. The North-South streets in
// particular have no vertex anywhere near the rendered area.

const labelStyle = new Style({
  stroke: new Stroke({color: '#888', width: 2}),
  text: new Text({
    font: 'bold 14px Ubuntu',
    placement: 'line',
    fill: new Fill({color: '#000'}),
    stroke: new Stroke({color: '#FFF', width: 2}),
  }),
});

new Map({
  pixelRatio: 1,
  layers: [
    new VectorTileLayer({
      declutter: false,
      style: function (feature) {
        const name = feature.get('name');
        if (!name) {
          return undefined;
        }
        labelStyle.getText().setText(name);
        return labelStyle;
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
