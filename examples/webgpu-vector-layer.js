import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import GeoJSON from '../src/ol/format/GeoJSON.js';
import WebGPUVectorLayer from '../src/ol/layer/WebGPUVector.js';
import VectorSource from '../src/ol/source/Vector.js';

const vectorLayer = new WebGPUVectorLayer({
  source: new VectorSource({
    url: 'https://openlayers.org/data/vector/ecoregions.json',
    format: new GeoJSON(),
  }),
  style: {
    'fill-color': ['string', ['get', 'COLOR'], '#eee'],
    'text-value': ['coalesce', ['get', 'ECO_NAME'], ''],
    'text-font': 'bold 12px "Open Sans", "Arial Unicode MS", sans-serif',
    'text-max-width': 120,
    'text-fill-color': '#333',
    'text-stroke-color': 'rgba(255,255,255,0.8)',
    'text-stroke-width': 2,
    'text-overflow': true,
    'text-declutter-mode': 'declutter',
  },
  declutter: true,
});

const highlightSource = new VectorSource();
// ideally this could be provided to the constructor above
highlightSource.setProjection('EPSG:4326');

const highlightLayer = new WebGPUVectorLayer({
  source: highlightSource,
  style: {
    'stroke-color': 'rgba(255,255,255,0.8)',
    'stroke-width': 2,
  },
});

const map = new Map({
  layers: [vectorLayer, highlightLayer],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 1,
  }),
});

let highlight;
const displayFeatureInfo = function (pixel) {
  const feature = map.forEachFeatureAtPixel(pixel, function (feature) {
    return feature;
  });

  const info = document.getElementById('info');
  if (feature) {
    info.innerHTML = feature.get('ECO_NAME') || '&nbsp;';
  } else {
    info.innerHTML = '&nbsp;';
  }
  map.getTargetElement().style.cursor = feature ? 'pointer' : '';

  if (feature !== highlight) {
    if (highlight) {
      highlightSource.removeFeature(highlight);
    }
    if (feature) {
      highlightSource.addFeature(feature);
    }
    highlight = feature;
  }
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
