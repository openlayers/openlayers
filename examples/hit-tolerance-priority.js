import CircleStyle from '../src/ol/style/Circle.js';
import Feature from '../src/ol/Feature.js';
import Map from '../src/ol/Map.js';
import VectorLayer from '../src/ol/layer/Vector.js';
import VectorSource from '../src/ol/source/Vector.js';
import View from '../src/ol/View.js';
import {Fill, Stroke, Style} from '../src/ol/style.js';
import {Point} from '../src/ol/geom.js';

const map = new Map({
  target: 'map',
  view: new View({
    center: [0, 0],
    resolution: 1,
    resolutions: [1],
  }),
});

const vectorLayer = new VectorLayer({
  source: new VectorSource({
    features: [
      new Feature({
        geometry: new Point([0, 0]),
        color: 'white',
      }),
      new Feature({
        geometry: new Point([-10, 0]),
        color: 'fuchsia',
      }),
      new Feature({
        geometry: new Point([-10, -10]),
        color: 'orange',
      }),
      new Feature({
        geometry: new Point([-10, 10]),
        color: 'cyan',
      }),
    ],
  }),
  style: (feature) => {
    return new Style({
      image: new CircleStyle({
        radius: 5,
        fill: new Fill({
          color: feature.get('color'),
        }),
        stroke: new Stroke({
          color: 'gray',
          width: 1,
        }),
      }),
    });
  },
});
map.addLayer(vectorLayer);

const highlightFeature = new Feature(new Point([NaN, NaN]));
highlightFeature.setStyle(
  new Style({
    image: new CircleStyle({
      radius: 5,
      stroke: new Stroke({
        color: 'black',
        width: 2,
      }),
    }),
  })
);
vectorLayer.getSource().addFeature(highlightFeature);
map.on('pointermove', (e) => {
  const hit = map.forEachFeatureAtPixel(
    e.pixel,
    (feature) => {
      highlightFeature.setGeometry(feature.getGeometry().clone());
      return true;
    },
    {
      hitTolerance: 10,
    }
  );
  if (!hit) {
    highlightFeature.setGeometry(new Point([NaN, NaN]));
  }
});
