import _ol_Map_ from '../src/ol/map';
import _ol_Overlay_ from '../src/ol/overlay';
import _ol_View_ from '../src/ol/view';
import _ol_layer_Tile_ from '../src/ol/layer/tile';
import _ol_source_TileJSON_ from '../src/ol/source/tilejson';
import _ol_source_TileUTFGrid_ from '../src/ol/source/tileutfgrid';

var key = 'pk.eyJ1IjoiYWhvY2V2YXIiLCJhIjoiRk1kMWZaSSJ9.E5BkluenyWQMsBLsuByrmg';

var mapLayer = new _ol_layer_Tile_({
  source: new _ol_source_TileJSON_({
    url: 'https://api.tiles.mapbox.com/v4/mapbox.geography-class.json?secure&access_token=' + key
  })
});


var gridSource = new _ol_source_TileUTFGrid_({
  url: 'https://api.tiles.mapbox.com/v4/mapbox.geography-class.json?secure&access_token=' + key
});

var gridLayer = new _ol_layer_Tile_({source: gridSource});

var view = new _ol_View_({
  center: [0, 0],
  zoom: 1
});

var mapElement = document.getElementById('map');
var map = new _ol_Map_({
  layers: [mapLayer, gridLayer],
  target: mapElement,
  view: view
});

var infoElement = document.getElementById('country-info');
var flagElement = document.getElementById('country-flag');
var nameElement = document.getElementById('country-name');

var infoOverlay = new _ol_Overlay_({
  element: infoElement,
  offset: [15, 15],
  stopEvent: false
});
map.addOverlay(infoOverlay);

var displayCountryInfo = function(coordinate) {
  var viewResolution = /** @type {number} */ (view.getResolution());
  gridSource.forDataAtCoordinateAndResolution(coordinate, viewResolution,
      function(data) {
        // If you want to use the template from the TileJSON,
        //  load the mustache.js library separately and call
        //  info.innerHTML = Mustache.render(gridSource.getTemplate(), data);
        mapElement.style.cursor = data ? 'pointer' : '';
        if (data) {
          flagElement.src = 'data:image/png;base64,' + data['flag_png'];
          nameElement.innerHTML = data['admin'];
        }
        infoOverlay.setPosition(data ? coordinate : undefined);
      });
};

map.on('pointermove', function(evt) {
  if (evt.dragging) {
    return;
  }
  var coordinate = map.getEventCoordinate(evt.originalEvent);
  displayCountryInfo(coordinate);
});

map.on('click', function(evt) {
  displayCountryInfo(evt.coordinate);
});
