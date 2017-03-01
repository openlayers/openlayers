goog.require('ol.format.WMSCapabilities');

var parser = new ol.format.WMSCapabilities();

fetch('data/ogcsample.xml').then(function(response) {
  return response.text();
}).then(function(text) {
  var result = parser.read(text);
  document.getElementById('log').innerText = JSON.stringify(result, null, 2);
});
