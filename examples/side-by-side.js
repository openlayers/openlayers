goog.require('ol.Map');
goog.require('ol.RendererHint');
goog.require('ol.View2D');
goog.require('ol.layer.TileLayer');
goog.require('ol.source.MapQuestOpenAerial');


var domMap = new ol.Map({
  layers: [
    new ol.layer.TileLayer({
      source: new ol.source.MapQuestOpenAerial()
    })
  ],
  renderer: ol.RendererHint.DOM,
  target: 'domMap',
  view: new ol.View2D({
    center: [0, 0],
    zoom: 1
  })
});


var webglMap = new ol.Map({
  renderer: ol.RendererHint.WEBGL,
  target: 'webglMap'
});
webglMap.bindTo('layers', domMap);
webglMap.bindTo('view', domMap);


var canvasMap = new ol.Map({
  renderer: ol.RendererHint.CANVAS,
  target: 'canvasMap'
});
canvasMap.bindTo('layers', domMap);
canvasMap.bindTo('view', domMap);
