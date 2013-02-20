goog.require('ol.parser.ogc.WMSCapabilities');

var parser = new ol.parser.ogc.WMSCapabilities(), result;
var url = '../test/spec/ol/parser/ogc/xml/wmscapabilities_v1_3_0/ogcsample.xml';

var xhr = new XMLHttpRequest();
xhr.open('GET', url, true);


/**
 * onload handler for the XHR request.
 */
xhr.onload = function() {
  if (xhr.status == 200) {
    result = parser.read(xhr.responseXML);
    document.getElementById('log').innerHTML = window.JSON.stringify(result);
  }
};
xhr.send();
