import _ol_Geolocation_ from '../src/ol/geolocation';
import _ol_Map_ from '../src/ol/map';
import _ol_View_ from '../src/ol/view';
import _ol_layer_Tile_ from '../src/ol/layer/tile';
import _ol_source_BingMaps_ from '../src/ol/source/bingmaps';


var view = new _ol_View_({
  center: [0, 0],
  zoom: 2
});

var map = new _ol_Map_({
  layers: [
    new _ol_layer_Tile_({
      source: new _ol_source_BingMaps_({
        key: 'As1HiMj1PvLPlqc_gtM7AqZfBL8ZL3VrjaS3zIb22Uvb9WKhuJObROC-qUpa81U5',
        imagerySet: 'Road'
      })
    })
  ],
  target: 'map',
  view: view
});

var geolocation = new _ol_Geolocation_({
  projection: view.getProjection(),
  tracking: true
});
geolocation.once('change:position', function() {
  view.setCenter(geolocation.getPosition());
  view.setResolution(2.388657133911758);
});
