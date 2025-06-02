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
    'fill-color': ['string', ['get', 'COLOR'], '#eee'],
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

let highlight;
const displayFeatureInfo = function (pixel) {
  const feature = map.forEachFeatureAtPixel(
    pixel,
    /**
     * @param {import('../src/ol/Feature.js').default} feature  Feature
     * @return {import('../src/ol/Feature.js').default} Feature
     */
    (feature) => feature,
  );
  if (feature === highlight) {
    return;
  }
  const info = document.getElementById('info');
  info.innerHTML = feature ? feature.get('ECO_NAME') || '&nbsp;' : '&nbsp;';

  if (highlight) {
    featureOverlay.getSource().removeFeature(highlight);
  }
  if (feature) {
    featureOverlay.getSource().addFeature(feature);
  }
  highlight = feature;
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
