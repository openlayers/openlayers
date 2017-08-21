goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.format.MVT');
goog.require('ol.layer.VectorTile');
goog.require('ol.proj');
goog.require('ol.source.VectorTile');
goog.require('ol.style.Fill');
goog.require('ol.style.Icon');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');
goog.require('ol.style.Text');
goog.require('ol.tilegrid.TileGrid');


var key = 'pk.eyJ1IjoiYWhvY2V2YXIiLCJhIjoiRk1kMWZaSSJ9.E5BkluenyWQMsBLsuByrmg';

// Calculation of resolutions that match zoom levels 1, 3, 5, 7, 9, 11, 13, 15.
var resolutions = [];
for (var i = 0; i <= 8; ++i) {
  resolutions.push(156543.03392804097 / Math.pow(2, i * 2));
}
// Calculation of tile urls for zoom levels 1, 3, 5, 7, 9, 11, 13, 15.
function tileUrlFunction(tileCoord) {
  return ('https://{a-d}.tiles.mapbox.com/v4/mapbox.mapbox-streets-v6/' +
      '{z}/{x}/{y}.vector.pbf?access_token=' + key)
      .replace('{z}', String(tileCoord[0] * 2 - 1))
      .replace('{x}', String(tileCoord[1]))
      .replace('{y}', String(-tileCoord[2] - 1))
      .replace('{a-d}', 'abcd'.substr(
          ((tileCoord[1] << tileCoord[0]) + tileCoord[2]) % 4, 1));
}

var map = new ol.Map({
  layers: [
    new ol.layer.VectorTile({
      source: new ol.source.VectorTile({
        attributions: '© <a href="https://www.mapbox.com/map-feedback/">Mapbox</a> ' +
          '© <a href="https://www.openstreetmap.org/copyright">' +
          'OpenStreetMap contributors</a>',
        format: new ol.format.MVT(),
        tileGrid: new ol.tilegrid.TileGrid({
          extent: ol.proj.get('EPSG:3857').getExtent(),
          resolutions: resolutions,
          tileSize: 512
        }),
        tileUrlFunction: tileUrlFunction
      }),
      style: createMapboxStreetsV6Style(ol.style.Style, ol.style.Fill, ol.style.Stroke, ol.style.Icon, ol.style.Text)
    })
  ],
  target: 'map',
  view: new ol.View({
    center: [0, 0],
    minZoom: 1,
    zoom: 2
  })
});
