import Feature from '../../../../src/ol/Feature.js';
import Map from '../../../../src/ol/Map.js';
import Point from '../../../../src/ol/geom/Point.js';
import VectorImageLayer from '../../../../src/ol/layer/VectorImage.js';
import VectorSource from '../../../../src/ol/source/Vector.js';
import View from '../../../../src/ol/View.js';
import {Fill, RegularShape, Stroke, Style} from '../../../../src/ol/style.js';
import {fromExtent} from '../../../../src/ol/geom/Polygon.js';

const extent = [
  1900e3 - 100000,
  6300e3 - 100000,
  1900e3 + 100000,
  6300e3 + 100000,
];

const pt1 = new Feature({
  name: 'point',
  geometry: new Point([1900e3, 6300e3]),
});
pt1.setStyle(
  new Style({
    image: new RegularShape({
      points: 4,
      radius: 20,
      fill: new Fill({
        color: 'fuchsia',
      }),
    }),
  })
);

const border = new Feature({
  name: 'extent border',
  geometry: fromExtent(extent),
});

new Map({
  layers: [
    new VectorImageLayer({
      style: new Style({
        stroke: new Stroke({
          color: 'yellow',
          width: 20,
        }),
      }),
      source: new VectorSource({
        features: [border],
      }),
    }),
    new VectorImageLayer({
      style: new Style({
        stroke: new Stroke({
          color: 'green',
          width: 20,
        }),
      }),
      source: new VectorSource({
        features: [pt1, border],
      }),
      extent: extent,
    }),
  ],
  target: 'map',
  view: new View({
    center: [1900e3, 6300e3],
    zoom: 7,
    rotation: Math.PI / 4,
  }),
});

render();
