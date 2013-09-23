goog.require('ol.Map');
goog.require('ol.RendererHint');
goog.require('ol.View2D');
goog.require('ol.control');
goog.require('ol.control.ScaleLine');
goog.require('ol.control.ScaleLineUnits');
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
      units: ol.control.ScaleLineUnits.DEGREES
    })
  ]),
  layers: layers,
  // The OSgeo server does not set cross origin headers, so we cannot use WebGL
  renderers: [ol.RendererHint.CANVAS, ol.RendererHint.DOM],
  target: 'map',
  view: new ol.View2D({
    projection: 'EPSG:4326',
    center: [0, 0],
    zoom: 2
  })
});
