goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.layer.Tile');
goog.require('ol.source.BingMaps');


var view = new ol.View({
  center: [-4808600, -2620936],
  zoom: 8
});

var map1 = new ol.Map({
  layers: [
    new ol.layer.Tile({
      preload: Infinity,
      source: new ol.source.BingMaps({
        key: 'As1HiMj1PvLPlqc_gtM7AqZfBL8ZL3VrjaS3zIb22Uvb9WKhuJObROC-qUpa81U5',
        imagerySet: 'Aerial'
      })
    })
  ],
  target: 'map1',
  view: view
});

var map2 = new ol.Map({
  layers: [
    new ol.layer.Tile({
      preload: 0, // default value
      source: new ol.source.BingMaps({
        key: 'As1HiMj1PvLPlqc_gtM7AqZfBL8ZL3VrjaS3zIb22Uvb9WKhuJObROC-qUpa81U5',
        imagerySet: 'AerialWithLabels'
      })
    })
  ],
  target: 'map2',
  view: view
});
