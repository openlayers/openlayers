import Map from '../../../src/ol/Map.js';
import View from '../../../src/ol/View.js';
import Feature from '../../../src/ol/Feature.js';
import Point from '../../../src/ol/geom/Point.js';
import VectorLayer from '../../../src/ol/layer/Vector.js';
import VectorSource from '../../../src/ol/source/Vector.js';
import Text from '../../../src/ol/style/Text.js';
import Style from '../../../src/ol/style/Style.js';
import Fill from '../../../src/ol/style/Fill.js';
import Stroke from '../../../src/ol/style/Stroke.js';
import LineString from '../../../src/ol/geom/LineString.js';

const nicePath = [
  20, 33, 40, 31, 60, 30, 80, 31, 100, 33, 120, 37, 140, 39, 160, 40,
  180, 39, 200, 37, 220, 33, 240, 31, 260, 30, 280, 31, 300, 33
];

const vectorSource = new VectorSource();
const pointStyle = new Style({
  text: new Text({
    text: 'Point Label',
    font: 'Ubuntu',
    fill: new Fill({
      color: 'red'
    }),
    stroke: new Stroke({
      color: 'black'
    })
  })
});
const lineStyle = new Style({
  stroke: new Stroke({color: 'blue'}),
  text: new Text({
    text: 'Line Label',
    font: 'Ubuntu',
    fill: new Fill({
      color: 'red'
    }),
    stroke: new Stroke({
      color: 'black'
    }),
    placement: 'line'
  })
});

const pointFeature1 = new Feature({
  geometry: new Point([160, 100])
});
pointFeature1.setStyle(pointStyle.clone());
pointFeature1.getStyle().getText().setText('POINT ONE');
vectorSource.addFeature(pointFeature1);

const pointFeature2 = new Feature({
  geometry: new Point([170, 105])
});
pointFeature2.setStyle(pointStyle.clone());
pointFeature2.getStyle().getText().setText('POINT TWO');
pointFeature2.getStyle().getText().setFill(new Fill({color: 'green'}));
vectorSource.addFeature(pointFeature2);

const pointFeature3 = new Feature({
  geometry: new Point([150, 95])
});
pointFeature3.setStyle(pointStyle.clone());
pointFeature3.getStyle().getText().setText('POINT THREE');
pointFeature3.getStyle().getText().setFill(new Fill({color: 'yellow'}));
vectorSource.addFeature(pointFeature3);

const lineString1 = new LineString(nicePath, 'XY');
const lineFeature1 = new Feature({geometry: lineString1});
lineFeature1.setStyle(lineStyle);
lineFeature1.getStyle().getText().setText('LINE ONE');
vectorSource.addFeature(lineFeature1);

const lineString2 = lineString1.clone();
lineString2.translate(10, 10);
const lineFeature2 = new Feature({geometry: lineString2});
lineFeature2.setStyle(lineStyle.clone());
lineFeature2.getStyle().getText().setText('LINE TWO');
lineFeature2.getStyle().getText().setFill(new Fill({color: 'green'}));
vectorSource.addFeature(lineFeature2);

const lineString3 = lineString1.clone();
lineString3.translate(-10, 10);
const lineFeature3 = new Feature({geometry: lineString3});
lineFeature3.setStyle(lineStyle.clone());
lineFeature3.getStyle().getText().setText('LINE THREE');
lineFeature3.getStyle().getText().setFill(new Fill({color: 'yellow'}));
vectorSource.addFeature(lineFeature3);

const map = new Map({
  pixelRatio: 1,
  layers: [
    new VectorLayer({
      source: vectorSource
    })
  ],
  target: 'map',
  view: new View({
    center: [0, 0],
    resolution: 1
  })
});
map.getView().fit(vectorSource.getExtent());

render({tolerance: 0.024});
