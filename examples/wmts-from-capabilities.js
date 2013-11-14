goog.require('ol.Map');
goog.require('ol.RendererHint');
goog.require('ol.View2D');
goog.require('ol.layer.Tile');
goog.require('ol.parser.ogc.WMTSCapabilities');
goog.require('ol.source.WMTS');


var map, capabilities;
var parser = new ol.parser.ogc.WMTSCapabilities();

var xhr = new XMLHttpRequest();
xhr.open('GET', 'data/WMTSCapabilities.xml', true);


/**
 * onload handler for the XHR request.
 */
xhr.onload = function() {
  if (xhr.status == 200) {
    capabilities = parser.read(xhr.responseXML);
    map = new ol.Map({
      layers: [
        new ol.layer.Tile({
          source: new ol.source.WMTS(ol.source.WMTS.optionsFromCapabilities(
              capabilities, 'fmzk'))
        }),
        new ol.layer.Tile({
          source: new ol.source.WMTS(ol.source.WMTS.optionsFromCapabilities(
              capabilities, 'beschriftung'))
        })
      ],
      renderer: ol.RendererHint.CANVAS,
      target: 'map',
      view: new ol.View2D({
        center: [1823849, 6143760],
        zoom: 11
      })
    });
  }
};
xhr.send();
