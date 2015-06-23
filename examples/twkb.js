goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.featureloader');
goog.require('ol.format.TWKB');
goog.require('ol.layer.Vector');
goog.require('ol.source.Vector');

var map = new ol.Map({
  layers: [
    new ol.layer.Vector({
      source: new ol.source.Vector({
        loader: ol.featureloader.xhr('data/twkb/line.twkb',
            new ol.format.TWKB())
      })
    })
  ],
  target: 'map',
  view: new ol.View({
    center: [0, 0],
    zoom: 20
  })
});
