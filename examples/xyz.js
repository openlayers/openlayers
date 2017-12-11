import _ol_Map_ from '../src/ol/Map.js';
import _ol_View_ from '../src/ol/View.js';
import _ol_layer_Tile_ from '../src/ol/layer/Tile.js';
import _ol_source_XYZ_ from '../src/ol/source/XYZ.js';


var map = new _ol_Map_({
  target: 'map',
  layers: [
    new _ol_layer_Tile_({
      source: new _ol_source_XYZ_({
        url: 'https://{a-c}.tile.thunderforest.com/cycle/{z}/{x}/{y}.png' +
            '?apikey=0e6fc415256d4fbb9b5166a718591d71'
      })
    })
  ],
  view: new _ol_View_({
    center: [-472202, 7530279],
    zoom: 12
  })
});
