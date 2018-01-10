import Feature from '../src/ol/Feature.js';
import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import Point from '../src/ol/geom/Point.js';
import VectorLayer from '../src/ol/layer/Vector.js';
import VectorSource from '../src/ol/source/Vector.js';
import _ol_style_Icon_ from '../src/ol/style/Icon.js';
import _ol_style_Style_ from '../src/ol/style/Style.js';


var iconInfo = [{
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

var i;

var iconCount = iconInfo.length;
var icons = new Array(iconCount);
for (i = 0; i < iconCount; ++i) {
  var info = iconInfo[i];
  icons[i] = new _ol_style_Icon_({
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

var featureCount = 50000;
var features = new Array(featureCount);
var feature, geometry;
var e = 25000000;
for (i = 0; i < featureCount; ++i) {
  geometry = new Point(
      [2 * e * Math.random() - e, 2 * e * Math.random() - e]);
  feature = new Feature(geometry);
  feature.setStyle(
      new _ol_style_Style_({
        image: icons[i % (iconCount - 1)]
      })
  );
  features[i] = feature;
}

var vectorSource = new VectorSource({
  features: features
});
var vector = new VectorLayer({
  source: vectorSource
});

var map = new Map({
  renderer: /** @type {Array<ol.renderer.Type>} */ (['webgl', 'canvas']),
  layers: [vector],
  target: document.getElementById('map'),
  view: new View({
    center: [0, 0],
    zoom: 5
  })
});

var overlayFeatures = [];
for (i = 0; i < featureCount; i += 30) {
  var clone = features[i].clone();
  clone.setStyle(null);
  overlayFeatures.push(clone);
}

new VectorLayer({
  map: map,
  source: new VectorSource({
    features: overlayFeatures
  }),
  style: new _ol_style_Style_({
    image: icons[iconCount - 1]
  })
});

map.on('click', function(evt) {
  var info = document.getElementById('info');
  info.innerHTML =
      'Hold on a second, while I catch those butterflies for you ...';

  window.setTimeout(function() {
    var features = [];
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
  var pixel = map.getEventPixel(evt.originalEvent);
  var hit = map.hasFeatureAtPixel(pixel);
  map.getTarget().style.cursor = hit ? 'pointer' : '';
});
