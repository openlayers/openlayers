import Collection from '../src/ol/Collection.js';
import Feature from '../src/ol/Feature.js';
import GeoJSON from '../src/ol/format/GeoJSON.js';
import Map from '../src/ol/Map.js';
import Point from '../src/ol/geom/Point.js';
import View from '../src/ol/View.js';
import {
  Circle as CircleStyle,
  Fill,
  Stroke,
  Style,
  Text,
} from '../src/ol/style.js';
import {OSM, Vector as VectorSource} from '../src/ol/source.js';
import {Tile as TileLayer, Vector as VectorLayer} from '../src/ol/layer.js';

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

function createStyle({textAlign, justify}) {
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
      })
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
