goog.require('ol.Map');
goog.require('ol.View2D');
goog.require('ol.format.GeoJSON');
goog.require('ol.layer.Vector');
goog.require('ol.proj');
goog.require('ol.source.TileVector');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');
goog.require('ol.tilegrid.XYZ');

var vectorSource = new ol.source.TileVector({
  format: new ol.format.GeoJSON({
    defaultProjection: 'EPSG:4326'
  }),
  projection: 'EPSG:3857',
  tileGrid: new ol.tilegrid.XYZ({
    maxZoom: 19
  }),
  url: 'http://{a-c}.tile.openstreetmap.us/vectiles-highroad/{z}/{x}/{y}.json'
});

var styleCache = {};
var styleFunction = function(feature, resolution) {
  var kind = feature.get('kind');
  var railway = feature.get('railway');
  var sort_key = feature.get('sort_key');
  var styleKey = kind + '/' + railway + '/' + sort_key;
  var styleArray = styleCache[styleKey];
  if (!styleArray) {
    var color, width;
    if (railway) {
      color = '#7de';
      width = 1;
    } else {
      color = {
        'major_road': '#776',
        'minor_road': '#ccb',
        'highway': '#f39'
      }[kind];
      width = kind == 'highway' ? 1.5 : 1;
    }
    styleArray = [new ol.style.Style({
      stroke: new ol.style.Stroke({
        color: color,
        width: width
      }),
      zIndex: sort_key
    })];
    styleCache[styleKey] = styleArray;
  }
  return styleArray;
};

var vector = new ol.layer.Vector({
  source: vectorSource,
  style: styleFunction
});

var map = new ol.Map({
  layers: [vector],
  renderer: 'canvas',
  target: document.getElementById('map'),
  view: new ol.View2D({
    center: ol.proj.transform([-74.0064, 40.7142], 'EPSG:4326', 'EPSG:3857'),
    maxZoom: 19,
    zoom: 14
  })
});
