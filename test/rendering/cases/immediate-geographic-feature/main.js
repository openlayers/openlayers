import TileLayer from '../../../../src/ol/layer/Tile.js';
import XYZ from '../../../../src/ol/source/XYZ.js';
import {Circle} from '../../../../src/ol/geom.js';
import {Feature, Map, View} from '../../../../src/ol/index.js';
import {Stroke, Style} from '../../../../src/ol/style.js';
import {getVectorContext} from '../../../../src/ol/render.js';
import {useGeographic} from '../../../../src/ol/proj.js';

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
