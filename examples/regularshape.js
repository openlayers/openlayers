import Feature from '../src/ol/Feature.js';
import Map from '../src/ol/Map.js';
import Point from '../src/ol/geom/Point.js';
import VectorLayer from '../src/ol/layer/Vector.js';
import VectorSource from '../src/ol/source/Vector.js';
import View from '../src/ol/View.js';
import {Fill, RegularShape, Stroke, Style} from '../src/ol/style.js';

const stroke = new Stroke({color: 'black', width: 2});
const fill = new Fill({color: 'red'});

const styles = {
  'square': new Style({
    image: new RegularShape({
      fill: fill,
      stroke: stroke,
      points: 4,
      radius: 10,
      angle: Math.PI / 4,
    }),
  }),
  'rectangle': new Style({
    image: new RegularShape({
      fill: fill,
      stroke: stroke,
      radius: 10 / Math.SQRT2,
      radius2: 10,
      points: 4,
      angle: 0,
      scale: [1, 0.5],
    }),
  }),
  'triangle': new Style({
    image: new RegularShape({
      fill: fill,
      stroke: stroke,
      points: 3,
      radius: 10,
      rotation: Math.PI / 4,
      angle: 0,
    }),
  }),
  'star': new Style({
    image: new RegularShape({
      fill: fill,
      stroke: stroke,
      points: 5,
      radius: 10,
      radius2: 4,
      angle: 0,
    }),
  }),
  'cross': new Style({
    image: new RegularShape({
      fill: fill,
      stroke: stroke,
      points: 4,
      radius: 10,
      radius2: 0,
      angle: 0,
    }),
  }),
  'x': new Style({
    image: new RegularShape({
      fill: fill,
      stroke: stroke,
      points: 4,
      radius: 10,
      radius2: 0,
      angle: Math.PI / 4,
    }),
  }),
  'stacked': [
    new Style({
      image: new RegularShape({
        fill: fill,
        stroke: stroke,
        points: 4,
        radius: 5,
        angle: Math.PI / 4,
        displacement: [0, 10],
      }),
    }),
    new Style({
      image: new RegularShape({
        fill: fill,
        stroke: stroke,
        points: 4,
        radius: 10,
        angle: Math.PI / 4,
      }),
    }),
  ],
};

const styleKeys = [
  'x',
  'cross',
  'star',
  'triangle',
  'square',
  'rectangle',
  'stacked',
];
const count = 250;
const features = new Array(count);
const e = 4500000;
for (let i = 0; i < count; ++i) {
  const coordinates = [2 * e * Math.random() - e, 2 * e * Math.random() - e];
  features[i] = new Feature(new Point(coordinates));
  features[i].setStyle(
    styles[styleKeys[Math.floor(Math.random() * styleKeys.length)]]
  );
}

const source = new VectorSource({
  features: features,
});

const vectorLayer = new VectorLayer({
  source: source,
});

const map = new Map({
  layers: [vectorLayer],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 2,
  }),
});

const colors = ['blue', 'green', 'yellow', 'aqua', 'red'];
let currentColor = 0;

document.getElementById('color-changer').addEventListener('click', function () {
  styles.square
    .getImage()
    .setFill(new Fill({color: colors[currentColor % colors.length]}));
  vectorLayer.changed();
  currentColor++;
});
