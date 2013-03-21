goog.require('ol.Coordinate');
goog.require('ol.Extent');
goog.require('ol.Map');
goog.require('ol.RendererHints');
goog.require('ol.View2D');
goog.require('ol.layer.TileLayer');
goog.require('ol.parser.ogc.WMTSCapabilities');
goog.require('ol.projection');
goog.require('ol.source.WMTS');


var map, capabilities;
var parser = new ol.parser.ogc.WMTSCapabilities();
var projection = ol.projection.configureProj4jsProjection({
  code: 'EPSG:21781',
  extent: new ol.Extent(485869.5728, 76443.1884, 837076.5648, 299941.7864)
});

var xhr = new XMLHttpRequest();
xhr.open('GET', 'http://wmts.geo.admin.ch/1.0.0/WMTSCapabilities.xml', true);


/**
 * onload handler for the XHR request.
 */
xhr.onload = function() {
  if (xhr.status == 200) {
    capabilities = parser.read(xhr.responseXML);
    var wmtsOptions = ol.source.WMTS.optionsFromCapabilities(
        capabilities, 'ch.swisstopo.pixelkarte-farbe');
    wmtsOptions.crossOrigin = 'anonymous';
    map = new ol.Map({
      layers: [
        new ol.layer.TileLayer({
          source: new ol.source.WMTS(wmtsOptions)
        })
      ],
      renderers: ol.RendererHints.createFromQueryData(),
      target: 'map',
      view: new ol.View2D({
        center: projection.getExtent().getCenter(),
        projection: projection,
        zoom: 1
      })
    });
  }
};
xhr.send();
