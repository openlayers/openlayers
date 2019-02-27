import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import TileLayer from '../src/ol/layer/Tile.js';
import TileWMS from '../src/ol/source/TileWMS.js';


const wmsSource = new TileWMS({
  url: 'https://ahocevar.com/geoserver/wms',
  params: {'LAYERS': 'ne:ne', 'TILED': true},
  serverType: 'geoserver',
  crossOrigin: 'anonymous'
});

const wmsLayer = new TileLayer({
  source: wmsSource
});

const view = new View({
  center: [0, 0],
  zoom: 1
});

const map = new Map({
  layers: [wmsLayer],
  target: 'map',
  view: view
});

map.on('singleclick', function(evt) {
  document.getElementById('info').innerHTML = '';
  const viewResolution = /** @type {number} */ (view.getResolution());
  const url = wmsSource.getGetFeatureInfoUrl(
    evt.coordinate, viewResolution, 'EPSG:3857',
    {'INFO_FORMAT': 'text/html'});
  if (url) {
    fetch(url)
      .then((response) => response.text())
      .then((html) => {
        document.getElementById('info').innerHTML = html;
      });
  }
});

map.on('pointermove', function(evt) {
  if (evt.dragging) {
    return;
  }
  const pixel = map.getEventPixel(evt.originalEvent);
  const hit = map.forEachLayerAtPixel(pixel, function() {
    return true;
  });
  map.getTargetElement().style.cursor = hit ? 'pointer' : '';
});
