import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import TileLayer from '../src/ol/layer/Tile.js';
import _ol_source_OSM_ from '../src/ol/source/OSM.js';

var map = new Map({
  layers: [
    new TileLayer({
      source: new _ol_source_OSM_()
    })
  ],
  target: 'map',
  view: new View({
    center: [-8730000, 5930000],
    rotation: Math.PI / 5,
    zoom: 8
  })
});


$('.ol-zoom-in, .ol-zoom-out').tooltip({
  placement: 'right'
});
$('.ol-rotate-reset, .ol-attribution button[title]').tooltip({
  placement: 'left'
});
