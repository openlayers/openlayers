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
    // inline right-bottom
    new Feature({
      geometry: new Point([-10, 50]),
      text: [
        'in',
        '',
        'line',
        'italic 20px/1.5 Ubuntu',
        '\n',
        '',
        'right-bottom',
        '20px/1.2 Ubuntu',
      ],
      textAlign: 'right',
      textBaseline: 'bottom',
    }),
    // multi-line - center-middle
    new Feature({
      geometry: new Point([0, 0]),
      text: ['multi-line', '', '\n', '', 'center-middle', 'italic 20px Ubuntu'],
      textAlign: 'center',
      textBaseline: 'middle',
    }),

    // inline right-top
    new Feature({
      geometry: new Point([-10, -50]),
      text: [
        'in',
        '',
        'line',
        'italic 20px/1.5 Ubuntu',
        '\n',
        '',
        'right-top',
        '28px/1 Ubuntu',
      ],
      textAlign: 'right',
      textBaseline: 'top',
    }),

    // inline left-bottom
    new Feature({
      geometry: new Point([10, 50]),
      text: [
        'in',
        '',
        'line',
        'italic 20px/1.5 Ubuntu',
        '\n',
        '',
        'left-bottom',
        '20px/1.2 Ubuntu',
      ],
      textAlign: 'left',
      textBaseline: 'bottom',
    }),

    // inline left-top
    new Feature({
      geometry: new Point([10, -50]),
      text: [
        'in',
        '',
        'line',
        'italic 20px/1.5 Ubuntu',
        '\n',
        '',
        'left-top',
        '28px/1 Ubuntu',
      ],
      textAlign: 'left',
      textBaseline: 'top',
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
            textBaseline: feature.get('textBaseline'),
            fill: new Fill({
              color: 'black',
            }),
            stroke: new Stroke({
              color: 'white',
            }),
            backgroundStroke: new Stroke({width: 1}),
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
