import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import TileLayer from '../src/ol/layer/Tile.js';
import BingMaps from '../src/ol/source/BingMaps.js';


var styles = [
  'Road',
  'RoadOnDemand',
  'Aerial',
  'AerialWithLabels',
  'collinsBart',
  'ordnanceSurvey'
];
var layers = [];
var i, ii;
for (i = 0, ii = styles.length; i < ii; ++i) {
  layers.push(new TileLayer({
    visible: false,
    preload: Infinity,
    source: new BingMaps({
      key: 'As1HiMj1PvLPlqc_gtM7AqZfBL8ZL3VrjaS3zIb22Uvb9WKhuJObROC-qUpa81U5',
      imagerySet: styles[i]
      // use maxZoom 19 to see stretched tiles instead of the BingMaps
      // "no photos at this zoom level" tiles
      // maxZoom: 19
    })
  }));
}
var map = new Map({
  layers: layers,
  // Improve user experience by loading tiles while dragging/zooming. Will make
  // zooming choppy on mobile or slow devices.
  loadTilesWhileInteracting: true,
  target: 'map',
  view: new View({
    center: [-6655.5402445057125, 6709968.258934638],
    zoom: 13
  })
});

var select = document.getElementById('layer-select');
function onChange() {
  var style = select.value;
  for (var i = 0, ii = layers.length; i < ii; ++i) {
    layers[i].setVisible(styles[i] === style);
  }
}
select.addEventListener('change', onChange);
onChange();
