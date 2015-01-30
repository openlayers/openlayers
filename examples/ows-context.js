goog.require('ol.format.OWSContext');

var parser = new ol.format.OWSContext();

$.ajax('data/owscontextsample.xml').then(function(response) {
  var result = parser.read(response);
  $('#log').html(window.JSON.stringify(result, null, 2));
});
