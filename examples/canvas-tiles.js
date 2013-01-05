goog.require('ol.Collection');
goog.require('ol.Coordinate');
goog.require('ol.Map');
goog.require('ol.Projection');
goog.require('ol.RendererHint');
goog.require('ol.layer.TileLayer');
goog.require('ol.source.DebugTileSource');
goog.require('ol.source.Stamen');


var layers = new ol.Collection([
  new ol.layer.TileLayer({
    source: new ol.source.Stamen({
      provider: ol.source.StamenProvider.WATERCOLOR
    })
  }),
  new ol.layer.TileLayer({
    source: new ol.source.DebugTileSource({
      projection: ol.Projection.getFromCode('EPSG:3857'),
      tileGrid: new ol.tilegrid.XYZ({
        maxZoom: 22
      })
    })
  })
]);

var webglMap = new ol.Map({
  view: new ol.View2D({
    center: ol.Projection.transformWithCodes(
        new ol.Coordinate(-0.1275, 51.507222), 'EPSG:4326', 'EPSG:3857'),
    zoom: 10
  }),
  layers: layers,
  renderer: ol.RendererHint.WEBGL,
  target: 'webglMap'
});

var domMap = new ol.Map({
  renderer: ol.RendererHint.DOM,
  target: 'domMap'
});
domMap.bindTo('layers', webglMap);
domMap.bindTo('view', webglMap);
