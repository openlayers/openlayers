import Feature from '../src/ol/Feature.js';
import Map from '../src/ol/WebGLMap.js';
import View from '../src/ol/View.js';
import Point from '../src/ol/geom/Point.js';
import VectorLayer from '../src/ol/layer/Vector.js';
import VectorSource from '../src/ol/source/Vector.js';
import {AtlasManager, Circle as CircleStyle, Fill, RegularShape, Stroke, Style} from '../src/ol/style.js';

const atlasManager = new AtlasManager({
  // we increase the initial size so that all symbols fit into
  // a single atlas image
  initialSize: 512
});

const symbolInfo = [{
  opacity: 1.0,
  scale: 1.0,
  fillColor: 'rgba(255, 153, 0, 0.4)',
  strokeColor: 'rgba(255, 204, 0, 0.2)'
}, {
  opacity: 0.75,
  scale: 1.25,
  fillColor: 'rgba(70, 80, 224, 0.4)',
  strokeColor: 'rgba(12, 21, 138, 0.2)'
}, {
  opacity: 0.5,
  scale: 1.5,
  fillColor: 'rgba(66, 150, 79, 0.4)',
  strokeColor: 'rgba(20, 99, 32, 0.2)'
}, {
  opacity: 1.0,
  scale: 1.0,
  fillColor: 'rgba(176, 61, 35, 0.4)',
  strokeColor: 'rgba(145, 43, 20, 0.2)'
}];

const radiuses = [3, 6, 9, 15, 19, 25];
const symbolCount = symbolInfo.length * radiuses.length * 2;
const symbols = [];
let i, j;
for (i = 0; i < symbolInfo.length; ++i) {
  const info = symbolInfo[i];
  for (j = 0; j < radiuses.length; ++j) {
    // circle symbol
    symbols.push(new CircleStyle({
      opacity: info.opacity,
      scale: info.scale,
      radius: radiuses[j],
      fill: new Fill({
        color: info.fillColor
      }),
      stroke: new Stroke({
        color: info.strokeColor,
        width: 1
      }),
      // by passing the atlas manager to the symbol,
      // the symbol will be added to an atlas
      atlasManager: atlasManager
    }));

    // star symbol
    symbols.push(new RegularShape({
      points: 8,
      opacity: info.opacity,
      scale: info.scale,
      radius: radiuses[j],
      radius2: radiuses[j] * 0.7,
      angle: 1.4,
      fill: new Fill({
        color: info.fillColor
      }),
      stroke: new Stroke({
        color: info.strokeColor,
        width: 1
      }),
      atlasManager: atlasManager
    }));
  }
}

const featureCount = 50000;
const features = new Array(featureCount);
let feature, geometry;
const e = 25000000;
for (i = 0; i < featureCount; ++i) {
  geometry = new Point(
    [2 * e * Math.random() - e, 2 * e * Math.random() - e]);
  feature = new Feature(geometry);
  feature.setStyle(
    new Style({
      image: symbols[i % symbolCount]
    })
  );
  features[i] = feature;
}

const vectorSource = new VectorSource({
  features: features
});
const vector = new VectorLayer({
  source: vectorSource
});

const map = new Map({
  layers: [vector],
  target: document.getElementById('map'),
  view: new View({
    center: [0, 0],
    zoom: 4
  })
});
