import Feature from '../../../../src/ol/Feature.js';
import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import Point from '../../../../src/ol/geom/Point.js';
import VectorLayer from '../../../../src/ol/layer/Vector.js';
import VectorSource from '../../../../src/ol/source/Vector.js';
import CircleStyle from '../../../../src/ol/style/Circle.js';
import Fill from '../../../../src/ol/style/Fill.js';
import Style from '../../../../src/ol/style/Style.js';
import Text from '../../../../src/ol/style/Text.js';

const features = [];
for (const [y, required] of [
  [60, false],
  [-60, true],
]) {
  for (const x of [-5, 5]) {
    const feature = new Feature(new Point([x, y]));
    feature.setStyle(
      new Style({
        image: new CircleStyle({
          radius: 18,
          fill: new Fill({color: '#0063a7'}),
          declutterMode: 'declutter',
          optional: required ? false : undefined,
        }),
        text: new Text({
          text: x < 0 ? '39' : '391',
          font: '16px Ubuntu',
          fill: new Fill({color: 'white'}),
          declutterMode: 'obstacle',
          optional: required ? false : undefined,
        }),
      }),
    );
    features.push(feature);
  }
}

new Map({
  target: 'map',
  pixelRatio: 1,
  layers: [
    new VectorLayer({
      declutter: true,
      source: new VectorSource({features}),
    }),
  ],
  view: new View({center: [0, 0], resolution: 1}),
});

render({
  message:
    'required image/text pair hides together, default modes remain independent',
});
