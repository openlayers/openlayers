import Feature from '../../../../src/ol/Feature.js';
import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import Circle from '../../../../src/ol/geom/Circle.js';
import MultiPolygon from '../../../../src/ol/geom/MultiPolygon.js';
import Polygon from '../../../../src/ol/geom/Polygon.js';
import VectorLayer from '../../../../src/ol/layer/Vector.js';
import VectorSource from '../../../../src/ol/source/Vector.js';
import Fill from '../../../../src/ol/style/Fill.js';
import Stroke from '../../../../src/ol/style/Stroke.js';
import Style from '../../../../src/ol/style/Style.js';

const vectorSource = new VectorSource();
let feature;

// rectangle
feature = new Feature({
  geometry: new Polygon([
    [
      [-102.5, 75],
      [-102.5, 115],
      [-42.5, 115],
      [-42.5, 75],
      [-102.5, 75],
    ],
  ]),
});

feature.setStyle(
  new Style({
    fill: new Fill({color: 'rgba(136, 136, 136, 0.72)'}),
    stroke: new Stroke({
      color: 'rgba(223, 113, 23, 0.8)',
      offset: 4,
      width: 1,
    }),
  }),
);
vectorSource.addFeature(feature);

// rectangle with 2 holes
feature = new Feature({
  geometry: new Polygon([
    [
      [-37.5, -32.5],
      [-37.5, 17.5],
      [32.5, 17.5],
      [32.5, -32.5],
      [-37.5, -32.5],
    ],
    [
      [-33.5, -28.5],
      [-21.5, -28.5],
      [-21.5, -16.5],
      [-33.5, -16.5],
      [-33.5, -28.5],
    ],
    [
      [12.5, -28.5],
      [26.5, -28.5],
      [26.5, -16.5],
      [12.5, -16.5],
      [12.5, -28.5],
    ],
  ]),
});

feature.setStyle(
  new Style({
    fill: new Fill({color: 'rgba(136, 136, 136, 0.72)'}),
    stroke: new Stroke({
      color: 'rgba(246, 137, 48, 0.4)',
      lineJoin: 'miter',
      lineCap: 'square',
      offset: -2,
      width: 4,
    }),
  }),
);
vectorSource.addFeature(feature);

// multipolygon
feature = new Feature({
  geometry: new MultiPolygon([
    [
      [
        [-110, -110],
        [-110, -80],
        [-80, -80],
        [-80, -110],
        [-110, -110],
      ],
    ],
    [
      [
        [-70, -100],
        [-70, -70],
        [-40, -70],
        [-40, -100],
        [-70, -100],
      ],
    ],
  ]),
});

feature.setStyle(
  new Style({
    fill: new Fill({color: 'rgba(136, 136, 136, 0.72)'}),
    stroke: new Stroke({
      color: 'rgba(180, 40, 40, 0.8)',
      offset: -6,
      width: 2,
    }),
  }),
);

vectorSource.addFeature(feature);

// circle
feature = new Feature({
  geometry: new Circle([85, 85], 15),
});

feature.setStyle(
  new Style({
    fill: new Fill({color: 'rgba(213, 216, 197, 0.72)'}),
    stroke: new Stroke({
      color: 'rgba(115, 180, 40, 0.8)',
      offset: -1,
      width: 2,
    }),
  }),
);

vectorSource.addFeature(feature);

new Map({
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

render();
