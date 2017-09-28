goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.layer.Tile');
goog.require('ol.source.XYZ');

var url = 'https://{a-c}.tiles.mapbox.com/v3/mapbox.world-bright/{z}/{x}/{y}.png';

var withTransition = new ol.layer.Tile({
  source: new ol.source.XYZ({url: url})
});

var withoutTransition = new ol.layer.Tile({
  source: new ol.source.XYZ({url: url, transition: 0}),
  visible: false
});

var map = new ol.Map({
  layers: [withTransition, withoutTransition],
  target: 'map',
  view: new ol.View({
    center: [0, 0],
    zoom: 2,
    maxZoom: 11
  })
});

document.getElementById('transition').addEventListener('change', function(event) {
  var transition = event.target.checked;
  withTransition.setVisible(transition);
  withoutTransition.setVisible(!transition);
});
