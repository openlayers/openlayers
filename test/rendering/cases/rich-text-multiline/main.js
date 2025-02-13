import Feature from '../../../../src/ol/Feature.js';
import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import Point from '../../../../src/ol/geom/Point.js';
import VectorLayer from '../../../../src/ol/layer/Vector.js';
import VectorSource from '../../../../src/ol/source/Vector.js';
import Fill from '../../../../src/ol/style/Fill.js';
import Stroke from '../../../../src/ol/style/Stroke.js';
import Style from '../../../../src/ol/style/Style.js';
import Text from '../../../../src/ol/style/Text.js';

const vectorSource = new VectorSource({
  features: [new Feature(new Point([0, 0]))],
});

const labelStyle = new Style({
  text: new Text({
    font: '13px Ubuntu,sans-serif',
    fill: new Fill({
      color: '#000',
    }),
    stroke: new Stroke({
      color: '#fff',
      width: 4,
    }),
    padding: [0, 0, 0, 0],
    overflow: false,
  }),
});

new Map({
  pixelRatio: 1,
  layers: [
    new VectorLayer({
      source: vectorSource,
      style: function (feature) {
        const textStyle = labelStyle.getText();
        textStyle.setFont('13px Ubuntu,sans-serif');
        textStyle.setBackgroundFill(
          new Fill({
            color: 'blue',
          }),
        );
        textStyle.setBackgroundStroke(
          new Stroke({
            color: 'red',
            width: 2,
          }),
        );
        textStyle.setStroke(
          new Stroke({
            color: '#b4ebaf',
            width: 4,
          }),
        );
        textStyle.setText([
          '30',
          'bold 23px/23px serif',
          '\n',
          '',
          ' Montana',
          '900 11px/11px serif',
          '\n',
          '',
          '6.858 people/mi²',
          'italic 11px/11px Ubuntu,sans-serif',
        ]);
        return labelStyle;
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
