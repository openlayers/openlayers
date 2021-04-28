import CircleStyle from '../../../../src/ol/style/Circle.js';
import Fill from '../../../../src/ol/style/Fill.js';
import Map from '../../../../src/ol/Map.js';
import Point from '../../../../src/ol/geom/Point.js';
import Stroke from '../../../../src/ol/style/Stroke.js';
import TileLayer from '../../../../src/ol/layer/Tile.js';
import View from '../../../../src/ol/View.js';
import XYZ from '../../../../src/ol/source/XYZ.js';
import {fromLonLat, transform} from '../../../../src/ol/proj.js';
import {getVectorContext} from '../../../../src/ol/render.js';

const center = fromLonLat([8.6, 50.1]);

const layer = new TileLayer({
  source: new XYZ({
    url: '/data/tiles/satellite/{z}/{x}/{y}.jpg',
    transition: 0,
  }),
});

const onRender = function (event) {
  const context = event.context;
  context.restore();
  const vectorContext = getVectorContext(event);
  vectorContext.setImageStyle(
    new CircleStyle({
      radius: 12,
      fill: new Fill({color: 'yellow'}),
      stroke: new Stroke({color: 'red', width: 1}),
    })
  );
  vectorContext.drawPoint(
    new Point(transform([13, 37], 'EPSG:4326', 'EPSG:3857'))
  );
};
layer.on('postrender', onRender);

const map = new Map({
  layers: [],
  target: 'map',
  view: new View({
    center: center,
    zoom: 3,
  }),
});
map.addLayer(layer);

render();
