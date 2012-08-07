/* This is a code which is going to be compiled together with the library */

goog.require('ol.Map');
goog.require('ol.layer.OSM');
goog.require('ol.Loc');

goog.require('goog.dom');

function init() {
    var map = new ol.Map();
    map.setContainer(goog.dom.getElement('map'));
    map.setLayers( [ new ol.layer.OSM() ] );
    map.setCenter( new ol.Loc(45, 5));
    map.setZoom(10);
}
window['init'] = init;
