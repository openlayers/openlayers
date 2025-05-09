import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import GeoJSON from '../src/ol/format/GeoJSON.js';
import VectorLayer from '../src/ol/layer/Vector.js';
import VectorSource from '../src/ol/source/Vector.js';
import Fill from '../src/ol/style/Fill.js';
import Stroke from '../src/ol/style/Stroke.js';
import Style from '../src/ol/style/Style.js';

const style = new Style({
  fill: new Fill({
    color: '#eeeeee',
  }),
});

const vector = new VectorLayer({
  source: new VectorSource({
    url: 'https://openlayers.org/data/vector/ecoregions.json',
    format: new GeoJSON(),
  }),
  background: 'white',
  style: function (feature) {
    const color = feature.get('COLOR') || '#eeeeee';
    style.getFill().setColor(color);
    return style;
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

const selectStyle = new Style({
  fill: new Fill({
    color: '#eeeeee',
  }),
  stroke: new Stroke({
    color: 'rgba(255, 255, 255, 0.7)',
    width: 2,
  }),
});

const status = document.getElementById('status');

/** @type {import('../src/ol/Feature.js').default|undefined} */
let selected = undefined;
map.on('pointermove', function (e) {
  const newSelected = map.forEachFeatureAtPixel(
    e.pixel,
    /**
     * @param {import('../src/ol/Feature.js').default} f Feature
     * @return {import('../src/ol/Feature.js').default} Feature
     */
    (f) => f,
  );
  if (newSelected === selected) {
    return;
  }
  if (selected) {
    selected.setStyle(undefined);
  }
  if (newSelected) {
    selectStyle.getFill().setColor(newSelected.get('COLOR') || '#eeeeee');
    newSelected.setStyle(selectStyle);
  }
  selected = newSelected;

  status.innerHTML = selected ? selected.get('ECO_NAME') : '&nbsp;';
});
