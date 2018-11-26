import Map from 'ol/Map';
import View from 'ol/View';
import {MultiPoint, Point} from 'ol/geom';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import {Circle as CircleStyle, Fill, Stroke, Style} from 'ol/style';
import {getVectorContext} from 'ol/render';

const tileLayer = new TileLayer({
  source: new OSM()
});

const map = new Map({
  layers: [tileLayer],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 2
  })
});

const imageStyle = new Style({
  image: new CircleStyle({
    radius: 5,
    fill: new Fill({color: 'yellow'}),
    stroke: new Stroke({color: 'red', width: 1})
  })
});

const headInnerImageStyle = new Style({
  image: new CircleStyle({
    radius: 2,
    fill: new Fill({color: 'blue'})
  })
});

const headOuterImageStyle = new Style({
  image: new CircleStyle({
    radius: 5,
    fill: new Fill({color: 'black'})
  })
});

const n = 200;
const omegaTheta = 30000; // Rotation period in ms
const R = 7e6;
const r = 2e6;
const p = 2e6;
tileLayer.on('postrender', function(event) {
  const vectorContext = getVectorContext(event);
  const frameState = event.frameState;
  const theta = 2 * Math.PI * frameState.time / omegaTheta;
  const coordinates = [];
  let i;
  for (i = 0; i < n; ++i) {
    const t = theta + 2 * Math.PI * i / n;
    const x = (R + r) * Math.cos(t) + p * Math.cos((R + r) * t / r);
    const y = (R + r) * Math.sin(t) + p * Math.sin((R + r) * t / r);
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
