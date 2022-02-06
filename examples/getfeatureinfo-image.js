import ImageLayer from '../src/ol/layer/Image.js';
import ImageWMS from '../src/ol/source/ImageWMS.js';
import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';

const wmsSource = new ImageWMS({
  url: 'https://ahocevar.com/geoserver/wms',
  params: {'LAYERS': 'ne:ne'},
  serverType: 'geoserver',
  crossOrigin: 'anonymous',
});

const wmsLayer = new ImageLayer({
  source: wmsSource,
});

const view = new View({
  center: [0, 0],
  zoom: 1,
});

const map = new Map({
  layers: [wmsLayer],
  target: 'map',
  view: view,
});

map.on('singleclick', function (evt) {
  document.getElementById('info').innerHTML = '';
  const viewResolution = /** @type {number} */ (view.getResolution());
  const url = wmsSource.getFeatureInfoUrl(
    evt.coordinate,
    viewResolution,
    'EPSG:3857',
    {'INFO_FORMAT': 'text/html'}
  );
  if (url) {
    fetch(url)
      .then((response) => response.text())
      .then((html) => {
        document.getElementById('info').innerHTML = html;
      });
  }
});

map.on('pointermove', function (evt) {
  if (evt.dragging) {
    return;
  }
  const data = wmsLayer.getData(evt.pixel);
  const hit = data && data[3] > 0; // transparent pixels have zero for data[3]
  map.getTargetElement().style.cursor = hit ? 'pointer' : '';
});
