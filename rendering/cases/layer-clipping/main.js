import Map from '../../../src/ol/Map.js';
import View from '../../../src/ol/View.js';
import XYZ from '../../../src/ol/source/XYZ.js';
import TileLayer from '../../../src/ol/layer/Tile.js';
import MultiPolygon from '../../../src/ol/geom/MultiPolygon.js';
import Style from '../../../src/ol/style/Style.js';
import Stroke from '../../../src/ol/style/Stroke.js';
import {getVectorContext} from '../../../src/ol/render.js';

const source = new XYZ({
  url: '/data/tiles/osm/{z}/{x}/{y}.png',
  transition: 0
});

const layer = new TileLayer({
  source: source
});

const geometry = new MultiPolygon([
  [[[-80, -40], [-40, 0], [-80, 40], [-120, 0], [-80, -40]]],
  [[[80, -40], [120, 0], [80, 40], [40, 0], [80, -40]]]
]).transform('EPSG:4326', 'EPSG:3857');

const style = new Style({
  stroke: new Stroke({
    width: 2,
    color: 'blue'
  })
});

layer.on('prerender', function(event) {
  const context = event.context;
  context.save();

  const vectorContext = getVectorContext(event);
  vectorContext.setStyle(style);
  vectorContext.drawGeometry(geometry);

  context.clip();
});

layer.on('postrender', function(event) {
  const context = event.context;
  context.restore();

  const vectorContext = getVectorContext(event);
  vectorContext.setStyle(style);
  vectorContext.drawGeometry(geometry);
});

new Map({
  pixelRatio: 1,
  target: 'map',
  layers: [layer],
  view: new View({
    center: [0, 0],
    zoom: 0
  })
});

render();
