goog.require('ol.format.WMSCapabilities');

var parser = new ol.format.WMSCapabilities();

$.ajax('data/ogcsample.xml').then(function(response) {
  var result = parser.read(response);
  $('#log').html(window.JSON.stringify(result, null, 2));
});
