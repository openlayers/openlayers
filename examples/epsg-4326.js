import Map from '../src/ol/Map.js';
import _ol_View_ from '../src/ol/View.js';
import {defaults as defaultControls} from '../src/ol/control.js';
import ScaleLine from '../src/ol/control/ScaleLine.js';
import TileLayer from '../src/ol/layer/Tile.js';
import _ol_source_TileWMS_ from '../src/ol/source/TileWMS.js';


var layers = [
  new TileLayer({
    source: new _ol_source_TileWMS_({
      url: 'https://ahocevar.com/geoserver/wms',
      params: {
        'LAYERS': 'ne:NE1_HR_LC_SR_W_DR',
        'TILED': true
      }
    })
  })
];

var map = new Map({
  controls: defaultControls().extend([
    new ScaleLine({
      units: 'degrees'
    })
  ]),
  layers: layers,
  target: 'map',
  view: new _ol_View_({
    projection: 'EPSG:4326',
    center: [0, 0],
    zoom: 2
  })
});
