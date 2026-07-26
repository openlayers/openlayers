import Feature from '../../../../src/ol/Feature.js';
import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import LineString from '../../../../src/ol/geom/LineString.js';
import VectorLayer from '../../../../src/ol/layer/Vector.js';
import VectorSource from '../../../../src/ol/source/Vector.js';
import Stroke from '../../../../src/ol/style/Stroke.js';
import Style from '../../../../src/ol/style/Style.js';
import Text from '../../../../src/ol/style/Text.js';

const feature = new Feature({
  geometry: new LineString([
    [20, 30],
    [300, 30],
  ]),
});

feature.setStyle([
  new Style({
    stroke: new Stroke({color: 'blue'}),
    // Above the line, no offsetX.
    text: new Text({
      text: 'no offsetX',
      font: '24px Ubuntu',
      placement: 'line',
      textAlign: 'left',
      offsetY: -20,
    }),
  }),
  new Style({
    // Below the line, shifted along it by offsetX.
    text: new Text({
      text: 'offsetX 60',
      font: '24px Ubuntu',
      placement: 'line',
      textAlign: 'left',
      offsetY: 20,
      offsetX: 60,
    }),
  }),
]);

const vectorSource = new VectorSource();
vectorSource.addFeature(feature);

const map = new Map({
  pixelRatio: 1,
  layers: [
    new VectorLayer({
      source: vectorSource,
    }),
  ],
  target: 'map',
  view: new View({
    center: [0, 0],
    resolution: 1,
  }),
});
map.getView().fit(vectorSource.getExtent());

render({tolerance: 0.01});
