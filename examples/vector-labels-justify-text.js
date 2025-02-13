import Collection from '../src/ol/Collection.js';
import Feature from '../src/ol/Feature.js';
import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import GeoJSON from '../src/ol/format/GeoJSON.js';
import Point from '../src/ol/geom/Point.js';
import TileLayer from '../src/ol/layer/Tile.js';
import VectorLayer from '../src/ol/layer/Vector.js';
import OSM from '../src/ol/source/OSM.js';
import VectorSource from '../src/ol/source/Vector.js';
import CircleStyle from '../src/ol/style/Circle.js';
import Fill from '../src/ol/style/Fill.js';
import Stroke from '../src/ol/style/Stroke.js';
import Style from '../src/ol/style/Style.js';
import Text from '../src/ol/style/Text.js';

const features = [
  {
    geometry: new Point([-8300000, 6095000]),
    textAlign: 'left',
  },
  {
    geometry: new Point([-8150000, 6095000]),
    textAlign: 'center',
  },
  {
    geometry: new Point([-8000000, 6095000]),
    textAlign: 'right',
  },
  {
    geometry: new Point([-8300000, 6025000]),
    textAlign: 'left',
    justify: 'center',
  },
  {
    geometry: new Point([-8150000, 6025000]),
    textAlign: 'center',
    justify: 'center',
  },
  {
    geometry: new Point([-8000000, 6025000]),
    textAlign: 'right',
    justify: 'center',
  },
  {
    geometry: new Point([-8300000, 5955000]),
    textAlign: 'left',
    justify: 'left',
  },
  {
    geometry: new Point([-8150000, 5955000]),
    textAlign: 'center',
    justify: 'left',
  },
  {
    geometry: new Point([-8000000, 5955000]),
    textAlign: 'right',
    justify: 'left',
  },
];

function createStyle({textAlign, justify = undefined}) {
  return new Style({
    image: new CircleStyle({
      radius: 10,
      fill: new Fill({color: 'rgba(255, 0, 0, 0.1)'}),
      stroke: new Stroke({color: 'red', width: 1}),
    }),
    text: new Text({
      font: '16px sans-serif',
      textAlign,
      justify,
      text:
        `Justify text inside box\ntextAlign: ${textAlign}` +
        (justify ? `\njustify: ${justify}` : ''),
      fill: new Fill({
        color: [255, 255, 255, 1],
      }),
      backgroundFill: new Fill({
        color: [168, 50, 153, 0.6],
      }),
      padding: [2, 2, 2, 2],
    }),
  });
}

const vectorPoints = new VectorLayer({
  source: new VectorSource({
    features: new Collection(
      features.map((featureOptions) => {
        const feature = new Feature({
          geometry: featureOptions.geometry,
        });
        feature.setStyle(createStyle(featureOptions));
        return feature;
      }),
    ),
    format: new GeoJSON(),
  }),
});

const map = new Map({
  layers: [
    new TileLayer({
      source: new OSM(),
    }),
    vectorPoints,
  ],
  target: 'map',
  view: new View({
    center: [-8150000, 6025000],
    zoom: 8,
  }),
});
