import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import GeoJSON from '../src/ol/format/GeoJSON.js';
import VectorLayer from '../src/ol/layer/Vector.js';
import VectorSource from '../src/ol/source/Vector.js';

const vectorLayer = new VectorLayer({
  background: '#1a2b39',
  source: new VectorSource({
    url: 'https://openlayers.org/data/vector/ecoregions.json',
    format: new GeoJSON(),
  }),
  style: {
    'fill-color': ['string', ['get', 'COLOR_NNH'], '#eee'],
  },
});

const map = new Map({
  layers: [vectorLayer],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 1,
  }),
});

const featureOverlay = new VectorLayer({
  source: new VectorSource(),
  map: map,
  style: {
    'stroke-color': 'rgba(255, 255, 255, 0.7)',
    'stroke-width': 2,
  },
});

/** @type {import('../src/ol/Feature.js').default|undefined} */
let highlight;
const displayFeatureInfo = function (pixel) {
  vectorLayer.getFeatures(pixel).then(function (features) {
    const feature =
      /** @type {import('../src/ol/Feature.js').default|undefined} */ (
        features.length ? features[0] : undefined
      );
    if (feature === highlight) {
      return;
    }
    const info = document.getElementById('info');
    info.innerHTML = feature
      ? feature.get('ECO_NAME') + ': ' + feature.get('NNH_NAME')
      : '&nbsp;';
    if (highlight) {
      featureOverlay.getSource().removeFeature(highlight);
    }
    if (feature) {
      featureOverlay.getSource().addFeature(feature);
    }
    highlight = feature;
  });
};

map.on('pointermove', function (evt) {
  if (evt.dragging) {
    return;
  }
  displayFeatureInfo(evt.pixel);
});

map.on('click', function (evt) {
  displayFeatureInfo(evt.pixel);
});
