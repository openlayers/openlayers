import _ol_Map_ from '../src/ol/map';
import _ol_View_ from '../src/ol/view';
import _ol_layer_Tile_ from '../src/ol/layer/tile';
import _ol_source_OSM_ from '../src/ol/source/osm';

var map = new _ol_Map_({
  layers: [
    new _ol_layer_Tile_({
      source: new _ol_source_OSM_()
    })
  ],
  target: 'map',
  view: new _ol_View_({
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
