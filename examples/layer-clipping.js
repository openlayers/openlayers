import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import TileLayer from '../src/ol/layer/Tile.js';
import OSM from '../src/ol/source/OSM.js';

const osm = new TileLayer({
  source: new OSM()
});

const map = new Map({
  layers: [osm],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 2
  })
});

osm.on('prerender', function(event) {
  const ctx = event.context;
  ctx.save();
  const pixelRatio = event.frameState.pixelRatio;
  const size = map.getSize();
  ctx.translate(size[0] / 2 * pixelRatio, size[1] / 2 * pixelRatio);
  ctx.scale(3 * pixelRatio, 3 * pixelRatio);
  ctx.translate(-75, -80);
  ctx.beginPath();
  ctx.moveTo(75, 40);
  ctx.bezierCurveTo(75, 37, 70, 25, 50, 25);
  ctx.bezierCurveTo(20, 25, 20, 62.5, 20, 62.5);
  ctx.bezierCurveTo(20, 80, 40, 102, 75, 120);
  ctx.bezierCurveTo(110, 102, 130, 80, 130, 62.5);
  ctx.bezierCurveTo(130, 62.5, 130, 25, 100, 25);
  ctx.bezierCurveTo(85, 25, 75, 37, 75, 40);
  ctx.clip();
  ctx.translate(75, 80);
  ctx.scale(1 / 3 / pixelRatio, 1 / 3 / pixelRatio);
  ctx.translate(-size[0] / 2 * pixelRatio, -size[1] / 2 * pixelRatio);
});

osm.on('postrender', function(event) {
  const ctx = event.context;
  ctx.restore();
});
