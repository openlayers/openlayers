goog.require('ol.Attribution');
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


// Mapbox access token - request your own at http://mabobox.com
var accessToken =
    'pk.eyJ1IjoiYWhvY2V2YXIiLCJhIjoiRk1kMWZaSSJ9.E5BkluenyWQMsBLsuByrmg';

// For how many zoom levels do we want to use the same vector tile?
var reuseZoomLevels = 2;
// Offset from web mercator zoom level 0
var zOffset = 1;

var resolutions = [];
for (var z = zOffset / reuseZoomLevels; z <= 22 / reuseZoomLevels; ++z) {
  resolutions.push(156543.03392804097 / Math.pow(2, z * reuseZoomLevels));
}

var map  = new ol.Map({
  layers: [
    new ol.layer.VectorTile({
      preload: Infinity,
      source: new ol.source.VectorTile({
        attributions: [new ol.Attribution({
          html: '© <a href="https://www.mapbox.com/map-feedback/">Mapbox</a> ' +
              '© <a href="http://www.openstreetmap.org/copyright">' +
              'OpenStreetMap contributors</a>'
        })],
        rightHandedPolygons: true,
        format: new ol.format.MVT(),
        tileGrid: new ol.tilegrid.TileGrid({
          extent: ol.proj.get('EPSG:3857').getExtent(),
          resolutions: resolutions
        }),
        tilePixelRatio: 16,
        tileUrlFunction: function(tileCoord) {
          return ('http://{a-d}.tiles.mapbox.com/v4/mapbox.mapbox-streets-v6/' +
              '{z}/{x}/{y}.vector.pbf?access_token=' + accessToken)
              .replace('{z}', String(tileCoord[0] * reuseZoomLevels + zOffset))
              .replace('{x}', String(tileCoord[1]))
              .replace('{y}', String(-tileCoord[2] - 1))
              .replace('{a-d}', 'abcd'.substr(
                  ((tileCoord[1] << tileCoord[0]) + tileCoord[2]) % 4, 1));
        }
      }),
      style: createMapboxStreetsV6Style()
    })
  ],
  target: 'map',
  view: new ol.View({
    center: [1823849, 6143760],
    minZoom: 1,
    zoom: 3
  })
});
