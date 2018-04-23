import Feature from '../src/ol/Feature.js';
import Map from '../src/ol/WebGLMap.js';
import View from '../src/ol/View.js';
import Point from '../src/ol/geom/Point.js';
import VectorLayer from '../src/ol/layer/Vector.js';
import VectorSource from '../src/ol/source/Vector.js';
import {Icon, Style} from '../src/ol/style.js';


const iconInfo = [{
  offset: [0, 0],
  opacity: 1.0,
  rotateWithView: true,
  rotation: 0.0,
  scale: 1.0,
  size: [55, 55]
}, {
  offset: [110, 86],
  opacity: 0.75,
  rotateWithView: false,
  rotation: Math.PI / 2.0,
  scale: 1.25,
  size: [55, 55]
}, {
  offset: [55, 0],
  opacity: 0.5,
  rotateWithView: true,
  rotation: Math.PI / 3.0,
  scale: 1.5,
  size: [55, 86]
}, {
  offset: [212, 0],
  opacity: 1.0,
  rotateWithView: true,
  rotation: 0.0,
  scale: 1.0,
  size: [44, 44]
}];

let i;

const iconCount = iconInfo.length;
const icons = new Array(iconCount);
for (i = 0; i < iconCount; ++i) {
  const info = iconInfo[i];
  icons[i] = new Icon({
    offset: info.offset,
    opacity: info.opacity,
    rotateWithView: info.rotateWithView,
    rotation: info.rotation,
    scale: info.scale,
    size: info.size,
    crossOrigin: 'anonymous',
    src: 'data/Butterfly.png'
  });
}

const featureCount = 50000;
const features = new Array(featureCount);
let feature, geometry;
const e = 25000000;
for (i = 0; i < featureCount; ++i) {
  geometry = new Point(
    [2 * e * Math.random() - e, 2 * e * Math.random() - e]);
  feature = new Feature(geometry);
  feature.setStyle(
    new Style({
      image: icons[i % (iconCount - 1)]
    })
  );
  features[i] = feature;
}

const vectorSource = new VectorSource({
  features: features
});
const vector = new VectorLayer({
  source: vectorSource
});

const map = new Map({
  layers: [vector],
  target: document.getElementById('map'),
  view: new View({
    center: [0, 0],
    zoom: 5
  })
});

const overlayFeatures = [];
for (i = 0; i < featureCount; i += 30) {
  const clone = features[i].clone();
  clone.setStyle(null);
  overlayFeatures.push(clone);
}

new VectorLayer({
  map: map,
  source: new VectorSource({
    features: overlayFeatures
  }),
  style: new Style({
    image: icons[iconCount - 1]
  })
});

map.on('click', function(evt) {
  const info = document.getElementById('info');
  info.innerHTML =
      'Hold on a second, while I catch those butterflies for you ...';

  window.setTimeout(function() {
    const features = [];
    map.forEachFeatureAtPixel(evt.pixel, function(feature) {
      features.push(feature);
      return false;
    });

    if (features.length === 1) {
      info.innerHTML = 'Got one butterfly';
    } else if (features.length > 1) {
      info.innerHTML = 'Got ' + features.length + ' butterflies';
    } else {
      info.innerHTML = 'Couldn\'t catch a single butterfly';
    }
  }, 1);
});

map.on('pointermove', function(evt) {
  if (evt.dragging) {
    return;
  }
  const pixel = map.getEventPixel(evt.originalEvent);
  const hit = map.hasFeatureAtPixel(pixel);
  map.getTarget().style.cursor = hit ? 'pointer' : '';
});
