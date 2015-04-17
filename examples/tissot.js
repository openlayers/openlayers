goog.require('ol.Feature');
goog.require('ol.Map');
goog.require('ol.Sphere');
goog.require('ol.View');
goog.require('ol.geom.Polygon');
goog.require('ol.layer.Tile');
goog.require('ol.layer.Vector');
goog.require('ol.source.TileWMS');
goog.require('ol.source.Vector');

var vectorLayer4326 = new ol.layer.Vector({
  source: new ol.source.Vector()
});

var vectorLayer3857 = new ol.layer.Vector({
  source: new ol.source.Vector()
});

var map4326 = new ol.Map({
  layers: [
    new ol.layer.Tile({
      source: new ol.source.TileWMS({
        url: 'http://demo.boundlessgeo.com/geoserver/wms',
        params: {
          'LAYERS': 'ne:NE1_HR_LC_SR_W_DR'
        }
      })
    }),
    vectorLayer4326
  ],
  renderer: 'canvas',
  target: 'map4326',
  view: new ol.View({
    projection: 'EPSG:4326',
    center: [0, 0],
    zoom: 2
  })
});

var map3857 = new ol.Map({
  layers: [
    new ol.layer.Tile({
      source: new ol.source.TileWMS({
        url: 'http://demo.boundlessgeo.com/geoserver/wms',
        params: {
          'LAYERS': 'ne:NE1_HR_LC_SR_W_DR'
        }
      })
    }),
    vectorLayer3857
  ],
  renderer: 'canvas',
  target: 'map3857',
  view: new ol.View({
    center: [0, 0],
    zoom: 2
  })
});

var wgs84Sphere = new ol.Sphere(6378137);

var radius = 800000;
var x, y;
for (x = -180; x < 180; x += 30) {
  for (y = -90; y < 90; y += 30) {
    var circle4326 = ol.geom.Polygon.circular(wgs84Sphere, [x, y], radius, 64);
    var circle3857 = circle4326.clone().transform('EPSG:4326', 'EPSG:3857');
    vectorLayer4326.getSource().addFeature(new ol.Feature(circle4326));
    vectorLayer3857.getSource().addFeature(new ol.Feature(circle3857));
  }
}
