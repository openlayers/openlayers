goog.require('ol.Map');
goog.require('ol.View2D');
goog.require('ol.format.GeoJSON');
goog.require('ol.layer.Tile');
goog.require('ol.layer.Vector');
goog.require('ol.proj');
goog.require('ol.source.Stamen');
goog.require('ol.source.TileVector');
goog.require('ol.tilegrid.XYZ');

var vectorSource = new ol.source.TileVector({
  format: new ol.format.GeoJSON({
    defaultProjection: 'EPSG:4326'
  }),
  projection: 'EPSG:3857',
  tileGrid: new ol.tilegrid.XYZ({
    maxZoom: 19
  }),
  url: 'http://www.somebits.com:8001/rivers/{z}/{x}/{y}.json',
  z: 11
});

var vector = new ol.layer.Vector({
  source: vectorSource
});

var raster = new ol.layer.Tile({
  source: new ol.source.Stamen({
    layer: 'terrain'
  })
});

var map = new ol.Map({
  layers: [raster, vector],
  renderer: 'canvas',
  target: document.getElementById('map'),
  view: new ol.View2D({
    center: ol.proj.transform([-120.976, 37.958], 'EPSG:4326', 'EPSG:3857'),
    maxZoom: 19,
    zoom: 11
  })
});
