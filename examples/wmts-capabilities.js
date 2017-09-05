import _ol_format_WMTSCapabilities_ from '../src/ol/format/wmtscapabilities';

var parser = new _ol_format_WMTSCapabilities_();

fetch('data/WMTSCapabilities.xml').then(function(response) {
  return response.text();
}).then(function(text) {
  var result = parser.read(text);
  document.getElementById('log').innerText = JSON.stringify(result, null, 2);
});
