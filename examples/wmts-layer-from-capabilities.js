import Map from 'ol/Map';
import View from 'ol/View';
import WMTSCapabilities from 'ol/format/WMTSCapabilities';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import WMTS, {optionsFromCapabilities} from 'ol/source/WMTS';

const parser = new WMTSCapabilities();
let map;

fetch('data/WMTSCapabilities.xml').then(function(response) {
  return response.text();
}).then(function(text) {
  const result = parser.read(text);
  const options = optionsFromCapabilities(result, {
    layer: 'layer-7328',
    matrixSet: 'EPSG:3857'
  });

  map = new Map({
    layers: [
      new TileLayer({
        source: new OSM(),
        opacity: 0.7
      }),
      new TileLayer({
        opacity: 1,
        source: new WMTS(/** @type {!module:ol/source/WMTS~Options} */ (options))
      })
    ],
    target: 'map',
    view: new View({
      center: [19412406.33, -5050500.21],
      zoom: 5
    })
  });
});
