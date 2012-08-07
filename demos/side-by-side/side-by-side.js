goog.require('ol.RendererHint');
goog.require('ol.createMap');
goog.require('ol.layer.MapQuestOpenAerial');
goog.require('ol.view.Attribution');


var layer = new ol.layer.MapQuestOpenAerial();

var layers = new ol.Collection();
layers.push(layer);

var domMap = ol.createMap(
    document.getElementById('domMap'),
    {'layers': layers},
    ol.RendererHint.DOM);
domMap.setCenter(new ol.Coordinate(0, 0));
domMap.setResolution(layer.getStore().getResolutions()[0]);

var webglMap = ol.createMap(
    document.getElementById('webglMap'),
    {},
    ol.RendererHint.WEBGL);
webglMap.bindTo('center', domMap);
webglMap.bindTo('layers', domMap);
webglMap.bindTo('resolution', domMap);
webglMap.bindTo('rotation', domMap);

var attributionView = new ol.view.Attribution(domMap);
document.getElementById('attribution').appendChild(
    attributionView.getElement());

goog.exportSymbol('layer', layer);
goog.exportSymbol('layers', layers);
goog.exportSymbol('domMap', domMap);
goog.exportSymbol('webglMap', webglMap);
