import Feature from '../../../../src/ol/Feature.js';
import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import MultiLineString from '../../../../src/ol/geom/MultiLineString.js';
import VectorLayer from '../../../../src/ol/layer/Vector.js';
import VectorSource from '../../../../src/ol/source/Vector.js';
import Stroke from '../../../../src/ol/style/Stroke.js';
import Style from '../../../../src/ol/style/Style.js';

const originalLineStyle = new Style({
  stroke: new Stroke({color: 'gray', width: 1, lineDash: [2, 4]}),
});

const innerOffsetStyle = new Style({
  stroke: new Stroke({color: '#f00', width: 2, offset: -8}),
});

const outerOffsetStyle = new Style({
  stroke: new Stroke({color: '#f00', width: 2, offset: 8}),
});

const vectorSource = new VectorSource();

function translateRing(ring, dx, dy) {
  return ring.map(([x, y]) => [x + dx, y + dy]);
}

// Closed 12-point polygon approximating a circle (first vertex === last vertex)
// Tests that the full ring is rendered and not incorrectly removed by the cycle detection
const circleCoords = [];
for (let i = 0; i <= 12; i++) {
  const angle = (2 * Math.PI * i) / 12;
  circleCoords.push([-80 + 50 * Math.cos(angle), 50 * Math.sin(angle)]);
}
const circleFeature = new Feature({
  geometry: new MultiLineString([circleCoords]),
});
circleFeature.setStyle([originalLineStyle, innerOffsetStyle]);
vectorSource.addFeature(circleFeature);

const circleOuterFeature = new Feature({
  geometry: new MultiLineString([translateRing(circleCoords, 0, -120)]),
});
circleOuterFeature.setStyle([originalLineStyle, outerOffsetStyle]);
vectorSource.addFeature(circleOuterFeature);

// Closed triangle (4 points, first vertex === last vertex)
// Tests that no excess offset segments appear at the closure point
const triangleCoords = [
  [-10, -30],
  [40, -30],
  [15, 30],
  [-10, -30],
];
const triangleFeature = new Feature({
  geometry: new MultiLineString([triangleCoords]),
});
triangleFeature.setStyle([originalLineStyle, innerOffsetStyle]);
vectorSource.addFeature(triangleFeature);

const triangleOuterFeature = new Feature({
  geometry: new MultiLineString([translateRing(triangleCoords, 0, -120)]),
});
triangleOuterFeature.setStyle([originalLineStyle, outerOffsetStyle]);
vectorSource.addFeature(triangleOuterFeature);

// Closed diamond (5 points, first vertex === last vertex)
// Tests that no excess offset segments appear at the closure point
const diamondCoords = [
  [60, 0],
  [90, 30],
  [120, 0],
  [90, -30],
  [60, 0],
];
const diamondFeature = new Feature({
  geometry: new MultiLineString([diamondCoords]),
});
diamondFeature.setStyle([originalLineStyle, outerOffsetStyle]);
vectorSource.addFeature(diamondFeature);

const diamondInnerFeature = new Feature({
  geometry: new MultiLineString([translateRing(diamondCoords, 0, -120)]),
});
diamondInnerFeature.setStyle([originalLineStyle, innerOffsetStyle]);
vectorSource.addFeature(diamondInnerFeature);

const vectorLayer = new VectorLayer({
  source: vectorSource,
});

new Map({
  pixelRatio: 1,
  layers: [vectorLayer],
  target: 'map',
  view: new View({
    center: [0, -60],
    resolution: 1.1,
  }),
});

render();
