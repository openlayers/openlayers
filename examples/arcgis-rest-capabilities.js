goog.require('ol.Attribution');
goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.control');
goog.require('ol.control.MousePosition');
goog.require('ol.layer.Tile');
goog.require('ol.proj');
goog.require('ol.proj.Projection');
goog.require('ol.source.TileArcGISRest');
goog.require('ol.source.XYZ');
goog.require('ol.tilegrid.TileGrid');

var map;

document.getElementById('get-caps').addEventListener('click', function() {
  var capsUrl = document.getElementById('caps-url').value;
  if (capsUrl.charAt(capsUrl.length - 1) === '?') {
    capsUrl = capsUrl.substring(0, capsUrl.length - 1);
  }
  $.ajax({
    url: capsUrl,
    jsonp: 'callback',
    dataType: 'jsonp',
    data: {
      f: 'json'
    },
    success: function(config) {
      if (config.error) {
        alert(config.error.message + '\n' +
            config.error.details.join('\n'));
      } else {
        var generator = new ol3Esri.LayerGenerator({config: config, url: capsUrl});
        var layer = generator.createLayer();
        var fullExtent = generator.getFullExtent();
        var resolutions = generator.getResolutions();
        var projection = generator.getProjection();
        if (!map) {
          map = new ol.Map({
            controls: ol.control.defaults().extend([
              new ol.control.MousePosition()]),
            layers: [layer],
            target: 'map',
            view: new ol.View({
              resolutions: resolutions,
              projection: projection
            })
          });
        } else {
          map.getLayers().clear();
          map.setView(new ol.View({
            resolutions: resolutions,
            projection: projection
          }));
          map.addLayer(layer);
        }
        map.getView().fit(fullExtent, /** @type {ol.Size} */(map.getSize()));
      }
    }
  });
});
