import MVT from '../src/ol/format/MVT.js';
import Map from '../src/ol/Map.js';
import VectorTileLayer from '../src/ol/layer/VectorTile.js';
import VectorTileSource from '../src/ol/source/VectorTile.js';
import View from '../src/ol/View.js';
import {Fill, Stroke, Style} from '../src/ol/style.js';

// lookup for selection objects
let selection = {};

const country = new Style({
  stroke: new Stroke({
    color: 'gray',
    width: 1,
  }),
  fill: new Fill({
    color: 'rgba(20,20,20,0.9)',
  }),
});
const selectedCountry = new Style({
  stroke: new Stroke({
    color: 'rgba(200,20,20,0.8)',
    width: 2,
  }),
  fill: new Fill({
    color: 'rgba(200,20,20,0.4)',
  }),
});

const vtLayer = new VectorTileLayer({
  declutter: true,
  source: new VectorTileSource({
    maxZoom: 15,
    format: new MVT({
      idProperty: 'iso_a3',
    }),
    url:
      'https://ahocevar.com/geoserver/gwc/service/tms/1.0.0/' +
      'ne:ne_10m_admin_0_countries@EPSG%3A900913@pbf/{z}/{x}/{-y}.pbf',
  }),
  style: country,
});

const map = new Map({
  layers: [vtLayer],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 2,
    multiWorld: true,
  }),
});

// Selection
const selectionLayer = new VectorTileLayer({
  map: map,
  renderMode: 'vector',
  source: vtLayer.getSource(),
  style: function (feature) {
    if (feature.getId() in selection) {
      return selectedCountry;
    }
  },
});

const selectElement = document.getElementById('type');

map.on(['click', 'pointermove'], function (event) {
  if (
    (selectElement.value === 'singleselect-hover' &&
      event.type !== 'pointermove') ||
    (selectElement.value !== 'singleselect-hover' &&
      event.type === 'pointermove')
  ) {
    return;
  }
  vtLayer.getFeatures(event.pixel).then(function (features) {
    if (!features.length) {
      selection = {};
      selectionLayer.changed();
      return;
    }
    const feature = features[0];
    if (!feature) {
      return;
    }
    const fid = feature.getId();

    if (selectElement.value.startsWith('singleselect')) {
      selection = {};
    }
    // add selected feature to lookup
    selection[fid] = feature;

    selectionLayer.changed();
  });
});
