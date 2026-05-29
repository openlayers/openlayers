import Feature from '../../../../src/ol/Feature.js';
import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import LineString from '../../../../src/ol/geom/LineString.js';
import VectorLayer from '../../../../src/ol/layer/Vector.js';
import VectorSource from '../../../../src/ol/source/Vector.js';
import Stroke from '../../../../src/ol/style/Stroke.js';
import Style from '../../../../src/ol/style/Style.js';

const originalLineStyle = new Style({
  stroke: new Stroke({color: 'gray', width: 1, lineDash: [1, 3]}),
});
const offsetLineColor = 'rgba(255, 119, 0, 1)';

const vectorSource = new VectorSource();
let feature;

feature = new Feature({
  geometry: new LineString([
    [-60, 60],
    [45, 60],
  ]),
});
vectorSource.addFeature(feature);

feature = new Feature({
  geometry: new LineString([
    [-60, -50],
    [30, 10],
  ]),
});
feature.setStyle([
  originalLineStyle,
  new Style({
    stroke: new Stroke({color: offsetLineColor, width: 1, offset: 5}),
  }),
]);
vectorSource.addFeature(feature);

feature = new Feature({
  geometry: new LineString([
    [-110, -100],
    [0, 100],
    [100, -90],
  ]),
});
feature.setStyle([
  originalLineStyle,
  new Style({
    stroke: new Stroke({
      color: offsetLineColor,
      width: 5,
      lineCap: 'square',
      lineDash: [4, 8],
      lineJoin: 'round',
      offset: -10,
    }),
  }),
]);
vectorSource.addFeature(feature);

feature = new Feature({
  geometry: new LineString([
    [-80, 80],
    [80, 80],
    [-40, -90],
  ]),
});
feature.setStyle([
  originalLineStyle,
  new Style({
    stroke: new Stroke({color: offsetLineColor, width: 1, offset: 0}),
  }),
]);
vectorSource.addFeature(feature);

new Map({
  pixelRatio: 1,
  layers: [
    new VectorLayer({
      opacity: 0.5,
      source: vectorSource,
    }),
  ],
  target: 'map',
  view: new View({
    center: [0, 0],
    resolution: 1,
  }),
});

render();
