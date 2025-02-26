import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import GeoJSON from '../src/ol/format/GeoJSON.js';
import VectorLayer from '../src/ol/layer/Vector.js';
import {fromLonLat} from '../src/ol/proj.js';
import VectorSource from '../src/ol/source/Vector.js';
import Fill from '../src/ol/style/Fill.js';
import Stroke from '../src/ol/style/Stroke.js';
import Style from '../src/ol/style/Style.js';

const highlightStyle = new Style({
  fill: new Fill({
    color: '#EEE',
  }),
  stroke: new Stroke({
    color: '#3399CC',
    width: 2,
  }),
});

const vector = new VectorLayer({
  background: 'white',
  source: new VectorSource({
    url: 'https://openlayers.org/data/vector/us-states.json',
    format: new GeoJSON(),
  }),
});

const map = new Map({
  layers: [vector],
  target: 'map',
  view: new View({
    center: fromLonLat([-100, 38.5]),
    zoom: 4,
    multiWorld: true,
  }),
});

/** @type {Array<import('../src/ol/Feature.js').default>} */
const selected = [];

const status = document.getElementById('status');

map.on('singleclick', function (e) {
  map.forEachFeatureAtPixel(
    e.pixel,
    /**
     * @param {import('../src/ol/Feature.js').default} f Feature
     */
    function (f) {
      const selIndex = selected.indexOf(f);
      if (selIndex < 0) {
        selected.push(f);
        f.setStyle(highlightStyle);
      } else {
        selected.splice(selIndex, 1);
        f.setStyle(undefined);
      }
    },
  );

  status.innerHTML = '&nbsp;' + selected.length + ' selected features';
});
