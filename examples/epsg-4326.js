goog.require('ol.Coordinate');
goog.require('ol.Map');
goog.require('ol.RendererHint');
goog.require('ol.View2D');
goog.require('ol.control.ScaleLine');
goog.require('ol.control.ScaleLineUnits');
goog.require('ol.control.defaults');
goog.require('ol.layer.TileLayer');
goog.require('ol.source.TiledWMS');


var layers = [
  new ol.layer.TileLayer({
    source: new ol.source.TiledWMS({
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
  controls: ol.control.defaults({}, [
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
    center: new ol.Coordinate(0, 0),
    zoom: 2
  })
});
