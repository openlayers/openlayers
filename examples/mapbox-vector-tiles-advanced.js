/* eslint-disable openlayers-internal/no-unused-requires */
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

// For how many zoom levels do we want to use the same vector tiles?
// 1 means "use tiles from all zoom levels". 2 means "use the same tiles for 2
// subsequent zoom levels".
var reuseZoomLevels = 2;

// Offset of loaded tiles from web mercator zoom level 0.
// 0 means "At map zoom level 0, use tiles from zoom level 0". 1 means "At map
// zoom level 0, use tiles from zoom level 1".
var zoomOffset = 1;

// Calculation of tile urls
var resolutions = [];
for (var z = zoomOffset / reuseZoomLevels; z <= 22 / reuseZoomLevels; ++z) {
  resolutions.push(156543.03392804097 / Math.pow(2, z * reuseZoomLevels));
}
function tileUrlFunction(tileCoord) {
  return ('https://{a-d}.tiles.mapbox.com/v4/mapbox.mapbox-streets-v6/' +
      '{z}/{x}/{y}.vector.pbf?access_token=' + key)
      .replace('{z}', String(tileCoord[0] * reuseZoomLevels + zoomOffset))
      .replace('{x}', String(tileCoord[1]))
      .replace('{y}', String(-tileCoord[2] - 1))
      .replace('{a-d}', 'abcd'.substr(
          ((tileCoord[1] << tileCoord[0]) + tileCoord[2]) % 4, 1));
}

var map = new ol.Map({
  layers: [
    new ol.layer.VectorTile({
      renderMode: 'vector',
      preload: Infinity,
      source: new ol.source.VectorTile({
        attributions: '© <a href="https://www.mapbox.com/map-feedback/">Mapbox</a> ' +
          '© <a href="http://www.openstreetmap.org/copyright">' +
          'OpenStreetMap contributors</a>',
        format: new ol.format.MVT(),
        tileGrid: new ol.tilegrid.TileGrid({
          extent: ol.proj.get('EPSG:3857').getExtent(),
          resolutions: resolutions
        }),
        tilePixelRatio: 16,
        tileUrlFunction: tileUrlFunction
      }),
      style: createMapboxStreetsV6Style()
    })
  ],
  target: 'map',
  view: new ol.View({
    center: [0, 0],
    minZoom: 1,
    zoom: 2
  })
});

// ol.style.Fill, ol.style.Icon, ol.style.Stroke, ol.style.Style and
// ol.style.Text are required for createMapboxStreetsV6Style()
