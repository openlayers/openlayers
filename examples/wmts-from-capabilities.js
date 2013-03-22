goog.require('ol.Coordinate');
goog.require('ol.Map');
goog.require('ol.RendererHint');
goog.require('ol.View2D');
goog.require('ol.layer.TileLayer');
goog.require('ol.parser.ogc.WMTSCapabilities');
goog.require('ol.source.WMTS');


// the getCapabilities document uses EPSG:31256 projection
Proj4js.defs['EPSG:31256'] = '+proj=tmerc +lat_0=0 ' +
    '+lon_0=16.33333333333333 +k=1 +x_0=0 +y_0=-5000000 +ellps=bessel ' +
    '+towgs84=577.326,90.129,463.919,5.137,1.474,5.297,2.4232 ' +
    '+units=m +no_defs';

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
        new ol.layer.TileLayer({
          source: new ol.source.WMTS(ol.source.WMTS.optionsFromCapabilities(
              capabilities, 'fmzk'))
        }),
        new ol.layer.TileLayer({
          source: new ol.source.WMTS(ol.source.WMTS.optionsFromCapabilities(
              capabilities, 'beschriftung'))
        })
      ],
      renderer: ol.RendererHint.CANVAS,
      target: 'map',
      view: new ol.View2D({
        center: new ol.Coordinate(1823849, 6143760),
        projection: 'EPSG:3857',
        zoom: 11
      })
    });
  }
};
xhr.send();
