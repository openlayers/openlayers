import StadiaMaps from '../src/ol/source/StadiaMaps.js';
import TileLayer from '../src/ol/layer/Tile.js';
import {Circle, Fill, Style} from '../src/ol/style.js';
import {Map, View} from '../src/ol/index.js';
import {Point} from '../src/ol/geom.js';
import {getVectorContext} from '../src/ol/render.js';
import {upAndDown} from '../src/ol/easing.js';
import {useGeographic} from '../src/ol/proj.js';

useGeographic();

const layer = new TileLayer({
  source: new StadiaMaps({
    layer: 'stamen_toner',
  }),
});

const map = new Map({
  layers: [layer],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 2,
  }),
});

const image = new Circle({
  radius: 8,
  fill: new Fill({color: 'rgb(255, 153, 0)'}),
});

const style = new Style({
  image: image,
});

const n = 1000;
const geometries = new Array(n);

for (let i = 0; i < n; ++i) {
  const lon = 360 * Math.random() - 180;
  const lat = 180 * Math.random() - 90;
  geometries[i] = new Point([lon, lat]);
}

layer.on('postrender', function (event) {
  const vectorContext = getVectorContext(event);

  for (let i = 0; i < n; ++i) {
    const importance = upAndDown(Math.pow((n - i) / n, 0.15));
    if (importance < 0.1) {
      continue;
    }
    image.setOpacity(importance);
    image.setScale(importance);
    vectorContext.setStyle(style);
    vectorContext.drawGeometry(geometries[i]);
  }

  const lon = 360 * Math.random() - 180;
  const lat = 180 * Math.random() - 90;
  geometries.push(new Point([lon, lat]));
  geometries.shift();
  map.render();
});
