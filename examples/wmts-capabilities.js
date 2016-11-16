goog.require('ol.format.WMTSCapabilities');

var parser = new ol.format.WMTSCapabilities();

fetch('data/WMTSCapabilities.xml').then(function(response) {
  return response.text();
}).then(function(text) {
  var result = parser.read(text);
  document.getElementById('log').innerText = JSON.stringify(result, null, 2);
});
