goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.layer.Tile');
goog.require('ol.proj');
goog.require('ol.source.OSM');
goog.require('ol.source.XYZ');

var mapMinZoom = 1;
var mapMaxZoom = 15;
var mapExtent = [-112.261791, 35.983744, -112.113981, 36.132062];

var map = new ol.Map({
  target: 'map',
  layers: [
    new ol.layer.Tile({
      source: new ol.source.OSM()
    }),
    new ol.layer.Tile({
      extent: ol.proj.transformExtent(mapExtent, 'EPSG:4326', 'EPSG:3857'),
      source: new ol.source.XYZ({
        attributions: 'Tiles © USGS, rendered with ' +
            '<a href="http://www.maptiler.com/">MapTiler</a>',
        url: 'https://tileserver.maptiler.com/grandcanyon@2x/{z}/{x}/{y}.png',
        tilePixelRatio: 2, // THIS IS IMPORTANT
        minZoom: mapMinZoom,
        maxZoom: mapMaxZoom
      })
    })
  ],
  view: new ol.View({
    projection: 'EPSG:3857',
    center: ol.proj.transform([-112.18688965, 36.057944835],
        'EPSG:4326', 'EPSG:3857'),
    zoom: 12
  })
});
