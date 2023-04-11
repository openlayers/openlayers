import Feature from '../../../../src/ol/Feature.js';
import Fill from '../../../../src/ol/style/Fill.js';
import Map from '../../../../src/ol/Map.js';
import Point from '../../../../src/ol/geom/Point.js';
import RegularShape from '../../../../src/ol/style/RegularShape.js';
import Stroke from '../../../../src/ol/style/Stroke.js';
import Style from '../../../../src/ol/style/Style.js';
import VectorLayer from '../../../../src/ol/layer/Vector.js';
import VectorSource from '../../../../src/ol/source/Vector.js';
import View from '../../../../src/ol/View.js';

const vectorSource = new VectorSource({
  features: [
    new Feature({
      geometry: new Point([0, 0]),
    }),
  ],
});

const regularShapeStyle = new RegularShape({
  fill: new Fill({color: 'red'}),
  stroke: new Stroke({color: 'blue'}),
  points: 4,
  radius: 10,
});

const vectorLayer = new VectorLayer({
  source: vectorSource,
  style: new Style({
    image: regularShapeStyle,
  }),
});

const map = new Map({
  target: 'map',
  layers: [vectorLayer],
  view: new View({
    center: [0, 0],
    resolution: 1,
  }),
});
map.renderSync();

regularShapeStyle.setFill(new Fill({color: 'green'}));
regularShapeStyle.setStroke(new Stroke({color: 'yellow'}));
vectorLayer.changed();

render();
