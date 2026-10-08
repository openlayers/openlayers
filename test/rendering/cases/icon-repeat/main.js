import Feature from '../../../../src/ol/Feature.js';
import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import LineString from '../../../../src/ol/geom/LineString.js';
import MultiLineString from '../../../../src/ol/geom/MultiLineString.js';
import VectorLayer from '../../../../src/ol/layer/Vector.js';
import VectorSource from '../../../../src/ol/source/Vector.js';
import Icon from '../../../../src/ol/style/Icon.js';
import Stroke from '../../../../src/ol/style/Stroke.js';
import Style from '../../../../src/ol/style/Style.js';

const vectorSource = new VectorSource();

function addFeature(geometry, iconOptions) {
  const feature = new Feature(geometry);
  feature.setStyle(
    new Style({
      stroke: new Stroke({color: '#999', width: 1}),
      image: new Icon(
        Object.assign(
          {src: '/data/fish.png', placement: 'line', rotateWithView: true},
          iconOptions,
        ),
      ),
    }),
  );
  vectorSource.addFeature(feature);
}

// icon without repeat on a linestring: a single icon centered on the line
addFeature(
  new LineString([
    [-100, 100],
    [100, 100],
  ]),
  {},
);

// icon without repeat on a multilinestring: each sub-line gets its own single icon
addFeature(
  new MultiLineString([
    [
      [-100, 60],
      [-20, 60],
    ],
    [
      [20, 60],
      [100, 60],
    ],
  ]),
  {},
);

// icon with repeat on a linestring
addFeature(
  new LineString([
    [-100, 20],
    [100, 20],
  ]),
  {repeat: 30},
);

// icon with repeat on a multilinestring
addFeature(
  new MultiLineString([
    [
      [-100, -20],
      [-20, -20],
    ],
    [
      [20, -20],
      [100, -20],
    ],
  ]),
  {repeat: 30},
);

// offset (sprite sub-rectangle) handling on a linestring
addFeature(
  new LineString([
    [-100, -60],
    [100, -60],
  ]),
  {
    src: '/data/sprites/gis_symbols.png',
    offset: [32, 0],
    size: [32, 32],
    repeat: 30,
  },
);

// displacement (shifted anchor) handling on a linestring
addFeature(
  new LineString([
    [-100, -100],
    [100, -100],
  ]),
  {displacement: [0, 20], repeat: 30},
);

// rotateWithView true/false on a linestring, with a rotated view
addFeature(
  new LineString([
    [-100, -140],
    [-20, -180],
  ]),
  {repeat: 20, rotateWithView: true},
);
addFeature(
  new LineString([
    [20, -140],
    [100, -180],
  ]),
  {repeat: 20, rotateWithView: false},
);

const map = new Map({
  pixelRatio: 1,
  layers: [
    new VectorLayer({
      source: vectorSource,
    }),
  ],
  target: 'map',
  view: new View({
    rotation: Math.PI / 8,
  }),
});
map.getView().fit([-110, -190, 110, 110]);

render({tolerance: 0.002});
