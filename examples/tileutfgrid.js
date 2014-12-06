goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.layer.Tile');
goog.require('ol.source.TileJSON');
goog.require('ol.source.TileUTFGrid');

var mapLayer = new ol.layer.Tile({
  source: new ol.source.TileJSON({
    url: 'http://api.tiles.mapbox.com/v3/mapbox.geography-class.json'
  })
});

var gridSource = new ol.source.TileUTFGrid({
  url: 'http://api.tiles.mapbox.com/v3/mapbox.geography-class.json',
  preemptive: true
});

var gridLayer = new ol.layer.Tile({source: gridSource});

var view = new ol.View({
  center: [0, 0],
  zoom: 1
});

var mapElement = document.getElementById('map');
var map = new ol.Map({
  layers: [mapLayer, gridLayer],
  target: mapElement,
  view: view
});

var flag = document.getElementById('flag');
var adminName = document.getElementById('admin_name');
map.on('pointermove', function(evt) {
  var viewResolution = /** @type {number} */ (view.getResolution());
  gridSource.forDataAtCoordinateAndResolution(evt.coordinate, viewResolution,
      function(data) {
        // If you want to use the template from the TileJSON,
        //  load the mustache.js library separately and call
        //  info.innerHTML = Mustache.render(gridSource.getTemplate(), data);
        mapElement.style.cursor = data ? 'pointer' : '';
        /* jshint -W069 */
        flag.src = data ? 'data:image/png;base64,' + data['flag_png'] : '';
        flag.style.visibility = data ? 'visible' : 'hidden';
        adminName.innerHTML = data ? data['admin'] : '&nbsp;';
        /* jshint +W069 */
      });
});
