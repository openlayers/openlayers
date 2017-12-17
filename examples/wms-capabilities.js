import WMSCapabilities from '../src/ol/format/WMSCapabilities.js';

var parser = new WMSCapabilities();

fetch('data/ogcsample.xml').then(function(response) {
  return response.text();
}).then(function(text) {
  var result = parser.read(text);
  document.getElementById('log').innerText = JSON.stringify(result, null, 2);
});
