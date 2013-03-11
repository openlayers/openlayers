var parser = new ol.parser.ogc.WMSCapabilities(), result;
var url = 'data/ogcsample.xml';

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
