import Feature from '../../../../src/ol/Feature.js';
import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import Circle from '../../../../src/ol/geom/Circle.js';
import TileLayer from '../../../../src/ol/layer/Tile.js';
import {useGeographic} from '../../../../src/ol/proj.js';
import {getVectorContext} from '../../../../src/ol/render.js';
import XYZ from '../../../../src/ol/source/XYZ.js';
import Stroke from '../../../../src/ol/style/Stroke.js';
import Style from '../../../../src/ol/style/Style.js';

useGeographic();

const center = [8.6, 50.1];

const layer = new TileLayer({
  source: new XYZ({
    url: '/data/tiles/satellite/{z}/{x}/{y}.jpg',
    transition: 0,
  }),
});

layer.on('postrender', (event) => {
  const context = getVectorContext(event);
  const style = new Style({
    stroke: new Stroke({
      width: 5,
      color: 'red',
    }),
  });
  const feature = new Feature(new Circle(center, 5));
  context.drawFeature(feature, style);
});

new Map({
  target: 'map',
  layers: [layer],
  view: new View({
    center: center,
    zoom: 3,
  }),
});

render();
