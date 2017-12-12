import _ol_Map_ from '../src/ol/Map.js';
import _ol_View_ from '../src/ol/View.js';
import _ol_layer_Tile_ from '../src/ol/layer/Tile.js';
import _ol_source_OSM_ from '../src/ol/source/OSM.js';

var logoElement = document.createElement('a');
logoElement.href = 'https://www.osgeo.org/';
logoElement.target = '_blank';

var logoImage = document.createElement('img');
logoImage.src = 'https://www.osgeo.org/sites/all/themes/osgeo/logo.png';

logoElement.appendChild(logoImage);

var map = new _ol_Map_({
  layers: [
    new _ol_layer_Tile_({
      source: new _ol_source_OSM_()
    })
  ],
  target: 'map',
  view: new _ol_View_({
    center: [0, 0],
    zoom: 2
  }),
  logo: logoElement
});
