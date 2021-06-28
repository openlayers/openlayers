import Feature from '../../../../src/ol/Feature.js';
import Fill from '../../../../src/ol/style/Fill.js';
import LineString from '../../../../src/ol/geom/LineString.js';
import Map from '../../../../src/ol/Map.js';
import Stroke from '../../../../src/ol/style/Stroke.js';
import Style from '../../../../src/ol/style/Style.js';
import Text from '../../../../src/ol/style/Text.js';
import VectorLayer from '../../../../src/ol/layer/Vector.js';
import VectorSource from '../../../../src/ol/source/Vector.js';
import View from '../../../../src/ol/View.js';

const vectorSource = new VectorSource();

const nicePath = [
  20, 33, 40, 31, 60, 30, 80, 31, 100, 33, 120, 37, 140, 39, 160, 40, 180, 39,
  200, 37, 220, 33, 240, 31, 260, 30, 280, 31, 300, 33,
];

const lineString1 = new LineString(nicePath, 'XY');
const feature1 = new Feature({geometry: lineString1});
feature1.setStyle(
  new Style({
    stroke: new Stroke({color: 'blue'}),
    text: new Text({
      text: 'Hello world',
      font: '10px Ubuntu',
      placement: 'line',
    }),
  })
);
vectorSource.addFeature(feature1);

const lineString2 = lineString1.clone();
lineString2.translate(0, 20);
const feature2 = new Feature({geometry: lineString2});
feature2.setStyle(
  new Style({
    stroke: new Stroke({color: 'blue'}),
    text: new Text({
      text: 'Scale 2',
      font: 'normal 400 12px/1 Ubuntu',
      scale: 2,
      textBaseline: 'bottom',
      textAlign: 'right',
      placement: 'line',
    }),
  })
);
vectorSource.addFeature(feature2);

const lineString3 = lineString2.clone();
lineString3.translate(0, 30);
const feature3 = new Feature({geometry: lineString3});
feature3.setStyle(
  new Style({
    stroke: new Stroke({color: 'blue'}),
    text: new Text({
      font: 'italic bold 0.75em Ubuntu',
      text: 'Set properties',
    }),
  })
);
feature3.getStyle().getText().setTextAlign('left');
feature3.getStyle().getText().setOffsetX(10);
feature3.getStyle().getText().setOffsetY(-10);
feature3.getStyle().getText().setPlacement('line');
feature3.getStyle().getText().setScale(1.1);
feature3
  .getStyle()
  .getText()
  .setStroke(new Stroke({color: '#00F7F8'}));
feature3
  .getStyle()
  .getText()
  .setFill(new Fill({color: '#006772'}));

vectorSource.addFeature(feature3);

const lineString4 = lineString3.clone();
lineString4.translate(0, 30);
const feature4 = new Feature({geometry: lineString4});
feature4.setStyle(
  new Style({
    stroke: new Stroke({color: 'blue'}),
    text: new Text({
      text: 'negative offsetX',
      font: 'normal 400 10px/1 Ubuntu',
      offsetX: -10,
      textAlign: 'end',
      textBaseline: 'top',
      placement: 'line',
    }),
  })
);
vectorSource.addFeature(feature4);

const lineString5 = lineString4.clone();
lineString5.translate(0, 20);
const feature5 = new Feature({geometry: lineString5});
feature5.setStyle(
  new Style({
    stroke: new Stroke({color: 'blue'}),
    text: new Text({
      text: 'Small text',
      font: '10px Ubuntu',
      offsetY: 5,
      scale: 0.7,
      textAlign: 'start',
      placement: 'line',
    }),
  })
);
vectorSource.addFeature(feature5);

const lineString6 = lineString5.clone();
lineString6.translate(0, 20);
const feature6 = new Feature({geometry: lineString6});
feature6.setStyle(
  new Style({
    stroke: new Stroke({color: 'blue'}),
    text: new Text({
      text: 'FILL AND STROKE',
      font: '10px Ubuntu',
      placement: 'line',
      fill: new Fill({color: '#FFC0CB'}),
      stroke: new Stroke({
        color: '#00FF00',
        width: 1,
      }),
    }),
  })
);
vectorSource.addFeature(feature6);

const lineString7 = lineString6.clone();
lineString7.translate(0, 30);
const feature7 = new Feature({geometry: lineString7});
feature7.setStyle(
  new Style({
    stroke: new Stroke({color: 'blue'}),
    text: new Text({
      text: 'Reflection',
      font: 'normal 400 12px/1 Ubuntu',
      scale: [2, -1],
      textBaseline: 'bottom',
      textAlign: 'right',
      placement: 'line',
      stroke: new Stroke({
        color: '#FFFF00',
        width: 1,
      }),
    }),
  })
);
vectorSource.addFeature(feature7);

const map = new Map({
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
    rotation: Math.PI / 4,
  }),
});
map.getView().fit(vectorSource.getExtent());

render({tolerance: 0.021});
