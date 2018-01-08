import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import TileLayer from '../src/ol/layer/Tile.js';
import _ol_source_XYZ_ from '../src/ol/source/XYZ.js';


var map = new Map({
  target: 'map',
  layers: [
    new TileLayer({
      source: new _ol_source_XYZ_({
        url: 'https://{a-c}.tile.thunderforest.com/cycle/{z}/{x}/{y}.png' +
            '?apikey=0e6fc415256d4fbb9b5166a718591d71'
      })
    })
  ],
  view: new View({
    center: [-472202, 7530279],
    zoom: 12
  })
});
