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

const uglyPath = [163, 22, 159, 30, 150, 30, 143, 24, 151, 17];

const lineString1 = new LineString(uglyPath, 'XY');
const feature1 = new Feature({geometry: lineString1});
feature1.setStyle(
  new Style({
    stroke: new Stroke({color: 'blue'}),
    text: new Text({
      text: 'Hello world',
      font: '10px Ubuntu',
      placement: 'line',
      overflow: true,
    }),
  })
);
vectorSource.addFeature(feature1);

const lineString2 = lineString1.clone();
lineString2.translate(0, 30);
const feature2 = new Feature({geometry: lineString2});
feature2.setStyle(
  new Style({
    stroke: new Stroke({color: 'red'}),
    text: new Text({
      text: 'Scale 2',
      scale: 2,
      textBaseline: 'bottom',
      textAlign: 'right',
      placement: 'line',
      font: 'italic bold 0.5em Ubuntu',
      overflow: true,
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
      text: 'Set properties',
    }),
  })
);
feature3.getStyle().getText().setTextAlign('left');
feature3.getStyle().getText().setOffsetX(10);
feature3.getStyle().getText().setOffsetY(-10);
feature3.getStyle().getText().setOverflow(true);
feature3.getStyle().getText().setPlacement('line');
feature3.getStyle().getText().setScale(1.2);
feature3
  .getStyle()
  .getText()
  .setStroke(new Stroke({color: '#00F7F8'}));
feature3
  .getStyle()
  .getText()
  .setFill(new Fill({color: '#006772'}));
feature3.getStyle().getText().setMaxAngle(Math.PI);

vectorSource.addFeature(feature3);

const lineString4 = lineString3.clone();
lineString4.translate(0, 30);
const feature4 = new Feature({geometry: lineString4});
feature4.setStyle(
  new Style({
    stroke: new Stroke({color: 'red'}),
    text: new Text({
      text: 'PLEASE OMIT ME IM UGLY',
      font: '10px Ubuntu',
      offsetX: -10,
      textAlign: 'start',
      textBaseline: 'top',
      placement: 'line',
      overflow: true,
    }),
  })
);
vectorSource.addFeature(feature4);

const lineString5 = lineString4.clone();
lineString5.translate(0, 30);
const feature5 = new Feature({geometry: lineString5});
feature5.setStyle(
  new Style({
    stroke: new Stroke({color: 'blue'}),
    text: new Text({
      text: 'Small text',
      font: '10px Ubuntu',
      offsetY: 5,
      scale: 0.7,
      rotation: 4,
      textAlign: 'end',
      placement: 'line',
      maxAngle: Math.PI,
      overflow: true,
    }),
  })
);
vectorSource.addFeature(feature5);

const lineString6 = lineString5.clone();
lineString6.translate(0, 30);
const feature6 = new Feature({geometry: lineString6});
feature6.setStyle(
  new Style({
    stroke: new Stroke({color: 'blue'}),
    text: new Text({
      text: 'FILL AND STROKE',
      font: '10px Ubuntu',
      placement: 'line',
      overflow: true,
      fill: new Fill({color: '#FFC0CB'}),
      stroke: new Stroke({
        color: '#00FF00',
      }),
    }),
  })
);
vectorSource.addFeature(feature6);

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
    rotation: -(Math.PI / 4),
  }),
});
map.getView().fit(vectorSource.getExtent());

render({tolerance: 0.02});
