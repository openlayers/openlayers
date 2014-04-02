goog.require('ol.Map');
goog.require('ol.View2D');
goog.require('ol.control');
goog.require('ol.control.ScaleLine');
goog.require('ol.layer.Tile');
goog.require('ol.source.TileWMS');


var layers = [
  new ol.layer.Tile({
    source: new ol.source.TileWMS({
      url: 'http://vmap0.tiles.osgeo.org/wms/vmap0',
      params: {
        'VERSION': '1.1.1',
        'LAYERS': 'basic',
        'FORMAT': 'image/jpeg'
      }
    })
  })
];

var map = new ol.Map({
  controls: ol.control.defaults().extend([
    new ol.control.ScaleLine({
      units: 'degrees'
    })
  ]),
  layers: layers,
  target: 'map',
  view: new ol.View2D({
    projection: 'EPSG:4326',
    center: [0, 0],
    zoom: 2
  })
});
