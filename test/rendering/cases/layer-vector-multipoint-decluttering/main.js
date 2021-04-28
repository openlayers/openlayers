import Feature from '../../../../src/ol/Feature.js';
import Map from '../../../../src/ol/Map.js';
import MultiPoint from '../../../../src/ol/geom/MultiPoint.js';
import VectorSource from '../../../../src/ol/source/Vector.js';
import View from '../../../../src/ol/View.js';
import {Icon, Stroke, Style, Text} from '../../../../src/ol/style.js';
import {Vector as VectorLayer} from '../../../../src/ol/layer.js';

const vectorLayer = new VectorLayer({
  declutter: true,
  renderBuffer: 0,
  source: new VectorSource({
    features: [
      new Feature(
        new MultiPoint([
          [0, 0],
          [0, 1],
          [0.5, 0.5],
          [0.9, 0.85],
          [1, 0],
          [0.3, 0.5],
        ])
      ),
    ],
  }),
  style: new Style({
    image: new Icon({
      anchor: [0.5, 46],
      anchorXUnits: 'fraction',
      anchorYUnits: 'pixels',
      src: '/data/icon.png',
    }),
    text: new Text({
      text: 'Test',
      font: 'italic 700 20px Ubuntu',
      stroke: new Stroke({
        color: 'red',
        width: 20,
      }),
    }),
  }),
});

new Map({
  layers: [vectorLayer],
  target: document.getElementById('map'),
  view: new View({
    center: [0.5, 0.5],
    resolution: 0.006679631467570084,
  }),
});

render({tolerance: 0.007});
