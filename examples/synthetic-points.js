import Feature from '../src/ol/Feature.js';
import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import {LineString, Point} from '../src/ol/geom.js';
import VectorLayer from '../src/ol/layer/Vector.js';
import VectorSource from '../src/ol/source/Vector.js';
import {Circle as CircleStyle, Fill, Stroke, Style} from '../src/ol/style.js';
import {getVectorContext} from '../src/ol/render.js';


const count = 20000;
const features = new Array(count);
const e = 18000000;
for (let i = 0; i < count; ++i) {
  features[i] = new Feature({
    'geometry': new Point(
      [2 * e * Math.random() - e, 2 * e * Math.random() - e]),
    'i': i,
    'size': i % 2 ? 10 : 20
  });
}

const styles = {
  '10': new Style({
    image: new CircleStyle({
      radius: 5,
      fill: new Fill({color: '#666666'}),
      stroke: new Stroke({color: '#bada55', width: 1})
    })
  }),
  '20': new Style({
    image: new CircleStyle({
      radius: 10,
      fill: new Fill({color: '#666666'}),
      stroke: new Stroke({color: '#bada55', width: 1})
    })
  })
};

const vectorSource = new VectorSource({
  features: features,
  wrapX: false
});
const vector = new VectorLayer({
  source: vectorSource,
  style: function(feature) {
    return styles[feature.get('size')];
  }
});

const map = new Map({
  layers: [vector],
  target: document.getElementById('map'),
  view: new View({
    center: [0, 0],
    zoom: 2
  })
});

let point = null;
let line = null;
const displaySnap = function(coordinate) {
  const closestFeature = vectorSource.getClosestFeatureToCoordinate(coordinate);
  if (closestFeature === null) {
    point = null;
    line = null;
  } else {
    const geometry = closestFeature.getGeometry();
    const closestPoint = geometry.getClosestPoint(coordinate);
    if (point === null) {
      point = new Point(closestPoint);
    } else {
      point.setCoordinates(closestPoint);
    }
    if (line === null) {
      line = new LineString([coordinate, closestPoint]);
    } else {
      line.setCoordinates([coordinate, closestPoint]);
    }
  }
  map.render();
};

map.on('pointermove', function(evt) {
  if (evt.dragging) {
    return;
  }
  const coordinate = map.getEventCoordinate(evt.originalEvent);
  displaySnap(coordinate);
});

map.on('click', function(evt) {
  displaySnap(evt.coordinate);
});

const stroke = new Stroke({
  color: 'rgba(255,255,0,0.9)',
  width: 3
});
const style = new Style({
  stroke: stroke,
  image: new CircleStyle({
    radius: 10,
    stroke: stroke
  })
});

vector.on('postrender', function(evt) {
  const vectorContext = getVectorContext(evt);
  vectorContext.setStyle(style);
  if (point !== null) {
    vectorContext.drawGeometry(point);
  }
  if (line !== null) {
    vectorContext.drawGeometry(line);
  }
});

map.on('pointermove', function(evt) {
  if (evt.dragging) {
    return;
  }
  const pixel = map.getEventPixel(evt.originalEvent);
  const hit = map.hasFeatureAtPixel(pixel);
  if (hit) {
    map.getTarget().style.cursor = 'pointer';
  } else {
    map.getTarget().style.cursor = '';
  }
});
