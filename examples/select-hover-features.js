import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import {pointerMove} from '../src/ol/events/condition.js';
import GeoJSON from '../src/ol/format/GeoJSON.js';
import Select from '../src/ol/interaction/Select.js';
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

function colorStyle(style) {
  return function (f) {
    style.getFill().setColor(f.get('COLOR') || '#eeeeee');
    return style;
  };
}

const vector = new VectorLayer({
  source: new VectorSource({
    url: 'https://openlayers.org/data/vector/ecoregions.json',
    format: new GeoJSON(),
  }),
  background: 'white',
  style: colorStyle(style),
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
const select = new Select({
  condition: pointerMove,
  style: colorStyle(selectStyle),
});
map.addInteraction(select);

select.on('select', function (e) {
  if (e.selected.length > 0) {
    status.innerHTML = e.selected[0].get('ECO_NAME');
  } else {
    status.innerHTML = '&nbsp;';
  }
});
