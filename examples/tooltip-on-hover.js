import Fill from '../src/ol/style/Fill.js';
import GeoJSON from '../src/ol/format/GeoJSON.js';
import Map from '../src/ol/Map.js';
import Style from '../src/ol/style/Style.js';
import VectorLayer from '../src/ol/layer/Vector.js';
import VectorSource from '../src/ol/source/Vector.js';
import View from '../src/ol/View.js';

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

const info = document.getElementById('info');
info.style.pointerEvents = 'none';
info.style.backgroundColor = 'red';
info.style.width = 'auto';
info.style.height = 'auto';
info.style.display = 'block';
const tooltip = new bootstrap.Tooltip(info, {offset: [0, 5]});

let currentFeature;
const displayFeatureInfo = function (pixel, target) {
  const feature = target.closest('.ol-control')
    ? undefined
    : map.forEachFeatureAtPixel(pixel, function (feature) {
        return feature;
      });
  if (feature) {
    info.style.left = pixel[0] + 10 + 'px';
    info.style.top = pixel[1] + 'px';
    if (feature !== currentFeature) {
      info.innerText = feature.get('ECO_NAME');
    }
    if (currentFeature) {
      tooltip.update();
    } else {
      tooltip.show();
    }
  } else {
    info.innerText = '';
  }
  currentFeature = feature;
};

map.on('pointermove', function (evt) {
  if (evt.dragging) {
    tooltip.hide();
    currentFeature = undefined;
    return;
  }
  const pixel = map.getEventPixel(evt.originalEvent);
  displayFeatureInfo(pixel, evt.originalEvent.target);
});

map.on('click', function (evt) {
  displayFeatureInfo(evt.pixel, evt.originalEvent.target);
});

map.getTargetElement().addEventListener('pointerleave', function () {
  tooltip.hide();
  currentFeature = undefined;
});
