goog.require('ol.parser.ogc.WMTSCapabilities');
goog.require('ol.projection.addCommonProjections');

ol.projection.addCommonProjections();
Proj4js.defs['EPSG:31256'] = '+proj=tmerc +lat_0=0 ' +
    '+lon_0=16.33333333333333 +k=1 +x_0=0 +y_0=-5000000 +ellps=bessel ' +
    '+towgs84=577.326,90.129,463.919,5.137,1.474,5.297,2.4232 ' +
    '+units=m +no_defs';
var parser = new ol.parser.ogc.WMTSCapabilities(), result;
var url = 'data/WMTSCapabilities.xml';

var xhr = new XMLHttpRequest();
xhr.open('GET', url, true);


/**
 * onload handler for the XHR request.
 */
xhr.onload = function() {
  if (xhr.status == 200) {
    result = parser.read(xhr.responseXML);
    document.getElementById('log').innerHTML =
        window.JSON.stringify(result, undefined, 2);
  }
};
xhr.send();
