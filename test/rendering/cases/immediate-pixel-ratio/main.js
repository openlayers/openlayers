import Feature from '../../../../src/ol/Feature.js';
import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import LineString from '../../../../src/ol/geom/LineString.js';
import MultiPoint from '../../../../src/ol/geom/MultiPoint.js';
import Point from '../../../../src/ol/geom/Point.js';
import VectorLayer from '../../../../src/ol/layer/Vector.js';
import {getVectorContext} from '../../../../src/ol/render.js';
import VectorSource from '../../../../src/ol/source/Vector.js';
import Fill from '../../../../src/ol/style/Fill.js';
import Icon from '../../../../src/ol/style/Icon.js';
import Stroke from '../../../../src/ol/style/Stroke.js';
import Style from '../../../../src/ol/style/Style.js';
import Text from '../../../../src/ol/style/Text.js';

const coordinates = [
  [50, -200, 0],
  [200, -200, 0],
  [100, -50, 0],
];
const img = new Image();
img.src =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCIgdmlld0JveD0iMCAwIDIwIDIwIiBzdHlsZT0iYmFja2dyb3VuZC1jb2xvcjogZ3JlZW47Ij48cGF0aCBkPSJtIDEwIDEwIDEwdiAtMTBoIiAvPjwvc3ZnPg==';
const point = new MultiPoint(coordinates);
const pointStyle = new Style({
  image: new Icon({
    img: img,
    size: [10, 10],
  }),
});
const line = new LineString(coordinates);
const lineStyle = new Style({
  stroke: new Stroke({
    color: 'red',
    width: 40,
    lineCap: 'square',
    lineJoin: 'round',
    lineDash: [30, 100],
    lineDashOffset: 5,
  }),
  text: new Text({
    text: '--- T e s t ___',
    placement: 'point',
    fill: new Fill({
      color: 'green',
    }),
    font: '50px Ubuntu',
    stroke: new Stroke({
      color: 'blue',
      width: 10,
      lineCap: 'butt',
      lineDash: [10, 5],
      lineDashOffset: 4,
    }),
  }),
});

const vector = new VectorLayer({
  source: new VectorSource({
    features: [new Feature(new Point([-20, -20]))],
  }),
});

vector.on('postrender', function (evt) {
  const context = getVectorContext(evt);
  context.setStyle(lineStyle);
  context.drawGeometry(line);

  context.setStyle(pointStyle);
  context.drawGeometry(point);
});

new Map({
  target: 'map',
  layers: [vector],
  view: new View({
    center: [256 / 2, -256 / 2],
    resolution: 1,
  }),
  pixelRatio: 2,
});

render();
