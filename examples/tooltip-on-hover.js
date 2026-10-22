import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import GeoJSON from '../src/ol/format/GeoJSON.js';
import VectorLayer from '../src/ol/layer/Vector.js';
import VectorSource from '../src/ol/source/Vector.js';

const vector = new VectorLayer({
  source: new VectorSource({
    url: 'https://openlayers.org/data/vector/ecoregions.json',
    format: new GeoJSON(),
  }),
  background: 'white',
  style: {
    'fill-color': ['string', ['get', 'COLOR'], '#eeeeee'],
  },
});

const map = new Map({
  layers: [vector],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 2,
  }),
});

const info = document.getElementById('info');

let currentFeature;
const updateTooltip = function (mapBrowserEvent) {
  const target = /** @type {HTMLElement} */ (
    mapBrowserEvent.originalEvent.target
  );
  if (!currentFeature || target.closest('.ol-control')) {
    info.style.visibility = 'hidden';
    return;
  }
  info.style.left = mapBrowserEvent.pixel[0] + 'px';
  info.style.top = mapBrowserEvent.pixel[1] + 'px';
  info.style.visibility = 'visible';
};

vector.on('featurehover', function (evt) {
  currentFeature = evt.feature;
  if (currentFeature) {
    info.innerText = currentFeature.get('ECO_NAME');
  }
  if (evt.mapBrowserEvent) {
    updateTooltip(evt.mapBrowserEvent);
  } else {
    info.style.visibility = 'hidden';
  }
});

vector.on('featureclick', function (evt) {
  currentFeature = evt.feature;
  if (currentFeature) {
    info.innerText = currentFeature.get('ECO_NAME');
  }
  updateTooltip(evt.mapBrowserEvent);
});

map.on('pointermove', function (evt) {
  if (!evt.dragging) {
    updateTooltip(evt);
  }
});
