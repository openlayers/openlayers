goog.require('ol.Map');
goog.require('ol.RendererHint');
goog.require('ol.View2D');
goog.require('ol.layer.Tile');
goog.require('ol.layer.Vector');
goog.require('ol.parser.GPX');
goog.require('ol.source.OSM');
goog.require('ol.source.Vector');

var raster = new ol.layer.Tile({
  source: new ol.source.OSM()
});

var vector = new ol.layer.Vector({
  source: new ol.source.Vector({
    parser: new ol.parser.GPX(),
    url: 'data/gpx/gpx4j.xml'
  }),
  style: new ol.style.Style({
    symbolizers: [
      new ol.style.Stroke({
        color: 'red',
        opacity: 1
      })
    ]
  })
});

var map = new ol.Map({
  layers: [raster, vector],
  renderer: ol.RendererHint.CANVAS,
  target: 'map',
  view: new ol.View2D({
    center: ol.proj.transform([-0.425692, 39.114318], 'EPSG:4326', 'EPSG:3857'),
    zoom: 19
  })
});
