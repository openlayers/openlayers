import Feature from '../../../src/ol/Feature.js';
import Map from '../../../src/ol/Map.js';
import View from '../../../src/ol/View.js';
import VectorLayer from '../../../src/ol/layer/Vector.js';
import VectorSource from '../../../src/ol/source/Vector.js';
import Style from '../../../src/ol/style/Style.js';
import Stroke from '../../../src/ol/style/Stroke.js';
import Polygon from '../../../src/ol/geom/Polygon.js';
import Circle from '../../../src/ol/geom/Circle.js';
import LineString from '../../../src/ol/geom/LineString.js';

const center = [1825927.7316762917, 6143091.089223046];

const source1 = new VectorSource();
const source2 = new VectorSource();
const vectorLayer1 = new VectorLayer({
  source: source1,
  style: new Style({
    stroke: new Stroke({
      color: '#3399CC',
      width: 1.25
    })
  })
});
const vectorLayer2 = new VectorLayer({
  source: source2,
  opacity: 0.6
});

function addCircle(r, source) {
  source.addFeature(new Feature(new Circle(center, r)));
}

function addPolygon(r, source) {
  source.addFeature(new Feature(new Polygon([
    [
      [center[0] - r, center[1] - r],
      [center[0] + r, center[1] - r],
      [center[0] + r, center[1] + r],
      [center[0] - r, center[1] + r],
      [center[0] - r, center[1] - r]
    ]
  ])));
}

const smallLine = new Feature(new LineString([
  [center[0], center[1] - 1],
  [center[0], center[1] + 1]
]));
smallLine.setStyle(new Style({
  zIndex: -99,
  stroke: new Stroke({width: 75, color: 'red'})
}));
smallLine.getGeometry().translate(-1000, 1000);
source1.addFeature(smallLine);
addPolygon(100, source1);
addCircle(200, source1);
addPolygon(250, source1);
addCircle(500, source1);
addPolygon(600, source1);
addPolygon(720, source1);

const smallLine2 = new Feature(new LineString([
  [center[0], center[1] - 1000],
  [center[0], center[1] + 1000]
]));
smallLine2.setStyle([
  new Style({
    stroke: new Stroke({width: 35, color: 'blue'})
  }),
  new Style({
    stroke: new Stroke({width: 15, color: 'green'})
  })
]);
smallLine2.getGeometry().translate(1000, 1000);
source1.addFeature(smallLine2);

const smallLine3 = new Feature(new LineString([
  [center[0], center[1] - 1],
  [center[0], center[1] + 1]
]));
smallLine3.setStyle([
  new Style({
    stroke: new Stroke({width: 75, color: 'red'})
  }),
  new Style({
    stroke: new Stroke({width: 45, color: 'white'})
  })
]);
smallLine3.getGeometry().translate(-1000, -1000);

addPolygon(400, source2);
addCircle(400, source2);
source2.addFeature(smallLine3);

const map = new Map({
  layers: [
    vectorLayer1,
    vectorLayer2
  ],
  target: 'map',
  view: new View({
    center: center,
    zoom: 13
  })
});

map.getView().setRotation(Math.PI + Math.PI / 4);

render();
