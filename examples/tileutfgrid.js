import Map from '../src/ol/Map.js';
import _ol_Overlay_ from '../src/ol/Overlay.js';
import View from '../src/ol/View.js';
import TileLayer from '../src/ol/layer/Tile.js';
import _ol_source_TileJSON_ from '../src/ol/source/TileJSON.js';
import _ol_source_TileUTFGrid_ from '../src/ol/source/TileUTFGrid.js';

var key = 'pk.eyJ1IjoiYWhvY2V2YXIiLCJhIjoiRk1kMWZaSSJ9.E5BkluenyWQMsBLsuByrmg';

var mapLayer = new TileLayer({
  source: new _ol_source_TileJSON_({
    url: 'https://api.tiles.mapbox.com/v4/mapbox.geography-class.json?secure&access_token=' + key
  })
});


var gridSource = new _ol_source_TileUTFGrid_({
  url: 'https://api.tiles.mapbox.com/v4/mapbox.geography-class.json?secure&access_token=' + key
});

var gridLayer = new TileLayer({source: gridSource});

var view = new View({
  center: [0, 0],
  zoom: 1
});

var mapElement = document.getElementById('map');
var map = new Map({
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
