goog.require('ol.Coordinate');
goog.require('ol.Map');
goog.require('ol.RendererHint');
goog.require('ol.View2D');
goog.require('ol.layer.TileLayer');
goog.require('ol.projection');
goog.require('ol.source.DebugTileSource');
goog.require('ol.source.OpenStreetMap');
goog.require('ol.tilegrid.XYZ');


var layers = [
  new ol.layer.TileLayer({
    source: new ol.source.OpenStreetMap()
  }),
  new ol.layer.TileLayer({
    source: new ol.source.DebugTileSource({
      projection: 'EPSG:3857',
      tileGrid: new ol.tilegrid.XYZ({
        maxZoom: 22
      })
    })
  })
];

var webglMap = new ol.Map({
  view: new ol.View2D({
    center: ol.projection.transform(
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

var canvasMap = new ol.Map({
  renderer: ol.RendererHint.DOM,
  target: 'canvasMap'
});
canvasMap.bindTo('layers', webglMap);
canvasMap.bindTo('view', webglMap);
