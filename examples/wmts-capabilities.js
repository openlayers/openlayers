goog.require('ol.parser.ogc.WMTSCapabilities');

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
