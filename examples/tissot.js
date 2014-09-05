goog.require('ol.Feature');
goog.require('ol.Map');
goog.require('ol.Sphere');
goog.require('ol.View');
goog.require('ol.geom.Polygon');
goog.require('ol.layer.Tile');
goog.require('ol.layer.Vector');
goog.require('ol.source.TileWMS');
goog.require('ol.source.Vector');

var vectorSource = new ol.source.Vector();

var map = new ol.Map({
  layers: [
    new ol.layer.Tile({
      source: new ol.source.TileWMS({
        url: 'http://demo.opengeo.org/geoserver/wms',
        params: {
          'LAYERS': 'ne:NE1_HR_LC_SR_W_DR'
        }
      })
    }),
    new ol.layer.Vector({
      source: vectorSource
    })
  ],
  renderer: 'canvas',
  target: 'map',
  view: new ol.View({
    projection: 'EPSG:4326',
    center: [0, 0],
    zoom: 2
  })
});

var wgs84Sphere = new ol.Sphere(6378137);

var radius = 800000;
for (var x = -180; x < 180; x += 30) {
  for (var y = -90; y < 90; y += 30) {
    var circle = ol.geom.Polygon.circular(wgs84Sphere, [x, y], radius, 64);
    vectorSource.addFeature(new ol.Feature(circle));
  }
}
