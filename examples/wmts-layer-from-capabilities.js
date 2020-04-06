import Map from '../src/ol/Map.js';
import OSM from '../src/ol/source/OSM.js';
import TileLayer from '../src/ol/layer/Tile.js';
import View from '../src/ol/View.js';
import WMTS, {optionsFromCapabilities} from '../src/ol/source/WMTS.js';
import WMTSCapabilities from '../src/ol/format/WMTSCapabilities.js';

const parser = new WMTSCapabilities();
let map;

fetch('data/WMTSCapabilities.xml')
  .then(function (response) {
    return response.text();
  })
  .then(function (text) {
    const result = parser.read(text);
    const options = optionsFromCapabilities(result, {
      layer: 'layer-7328',
      matrixSet: 'EPSG:3857',
    });

    map = new Map({
      layers: [
        new TileLayer({
          source: new OSM(),
          opacity: 0.7,
        }),
        new TileLayer({
          opacity: 1,
          source: new WMTS(options),
        }),
      ],
      target: 'map',
      view: new View({
        center: [19412406.33, -5050500.21],
        zoom: 5,
      }),
    });
  });
