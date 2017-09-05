import _ol_format_WMSCapabilities_ from '../src/ol/format/wmscapabilities';

var parser = new _ol_format_WMSCapabilities_();

fetch('data/ogcsample.xml').then(function(response) {
  return response.text();
}).then(function(text) {
  var result = parser.read(text);
  document.getElementById('log').innerText = JSON.stringify(result, null, 2);
});
