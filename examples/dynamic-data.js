import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import MultiPoint from '../src/ol/geom/MultiPoint.js';
import Point from '../src/ol/geom/Point.js';
import TileLayer from '../src/ol/layer/Tile.js';
import {getVectorContext} from '../src/ol/render.js';
import OSM from '../src/ol/source/OSM.js';
import CircleStyle from '../src/ol/style/Circle.js';
import Fill from '../src/ol/style/Fill.js';
import Stroke from '../src/ol/style/Stroke.js';
import Style from '../src/ol/style/Style.js';

const tileLayer = new TileLayer({
  source: new OSM(),
});

const map = new Map({
  layers: [tileLayer],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 2,
  }),
});

const imageStyle = new Style({
  image: new CircleStyle({
    radius: 5,
    fill: new Fill({color: 'yellow'}),
    stroke: new Stroke({color: 'red', width: 1}),
  }),
});

const headInnerImageStyle = new Style({
  image: new CircleStyle({
    radius: 2,
    fill: new Fill({color: 'blue'}),
  }),
});

const headOuterImageStyle = new Style({
  image: new CircleStyle({
    radius: 5,
    fill: new Fill({color: 'black'}),
  }),
});

const n = 200;
const omegaTheta = 30000; // Rotation period in ms
const R = 7e6;
const r = 2e6;
const p = 2e6;
tileLayer.on('postrender', function (event) {
  const vectorContext = getVectorContext(event);
  const frameState = event.frameState;
  const theta = (2 * Math.PI * frameState.time) / omegaTheta;
  const coordinates = [];
  let i;
  for (i = 0; i < n; ++i) {
    const t = theta + (2 * Math.PI * i) / n;
    const x = (R + r) * Math.cos(t) + p * Math.cos(((R + r) * t) / r);
    const y = (R + r) * Math.sin(t) + p * Math.sin(((R + r) * t) / r);
    coordinates.push([x, y]);
  }
  vectorContext.setStyle(imageStyle);
  vectorContext.drawGeometry(new MultiPoint(coordinates));

  const headPoint = new Point(coordinates[coordinates.length - 1]);

  vectorContext.setStyle(headOuterImageStyle);
  vectorContext.drawGeometry(headPoint);

  vectorContext.setStyle(headInnerImageStyle);
  vectorContext.drawGeometry(headPoint);

  map.render();
});
map.render();
