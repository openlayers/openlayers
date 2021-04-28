import CircleStyle from '../../../../src/ol/style/Circle.js';
import Feature from '../../../../src/ol/Feature.js';
import Fill from '../../../../src/ol/style/Fill.js';
import Map from '../../../../src/ol/Map.js';
import Point from '../../../../src/ol/geom/Point.js';
import Stroke from '../../../../src/ol/style/Stroke.js';
import Style from '../../../../src/ol/style/Style.js';
import Text from '../../../../src/ol/style/Text.js';
import VectorLayer from '../../../../src/ol/layer/Vector.js';
import VectorSource from '../../../../src/ol/source/Vector.js';
import View from '../../../../src/ol/View.js';

const vectorSource = new VectorSource({
  features: [
    // Latin - end (right)
    new Feature({
      geometry: new Point([-10, 50]),
      text: 'Latin',
      textAlign: 'end',
    }),

    // Hebrew - start (right)
    new Feature({
      geometry: new Point([-10, 0]),
      text: 'עִברִית',
      textAlign: 'start',
    }),

    // Arabic - start (right)
    new Feature({
      geometry: new Point([-10, -50]),
      text: 'عربى',
      textAlign: 'start',
    }),

    // Latin - start (left)
    new Feature({
      geometry: new Point([10, 50]),
      text: 'Latin',
      textAlign: 'start',
    }),

    // Hebrew - end (left)
    new Feature({
      geometry: new Point([10, 0]),
      text: 'עִברִית',
      textAlign: 'end',
    }),

    // Arabic - end (left)
    new Feature({
      geometry: new Point([10, -50]),
      text: 'عربى',
      textAlign: 'end',
    }),
  ],
});

new Map({
  pixelRatio: 1,
  layers: [
    new VectorLayer({
      source: vectorSource,
      style: function (feature) {
        return new Style({
          text: new Text({
            text: feature.get('text'),
            font: '24px Ubuntu',
            textAlign: feature.get('textAlign'),
            fill: new Fill({
              color: 'black',
            }),
            stroke: new Stroke({
              color: 'white',
            }),
          }),
          image: new CircleStyle({
            radius: 10,
            fill: new Fill({
              color: 'cyan',
            }),
          }),
        });
      },
    }),
  ],
  target: 'map',
  view: new View({
    center: [0, 0],
    resolution: 1,
  }),
});

render({tolerance: 0.01});
